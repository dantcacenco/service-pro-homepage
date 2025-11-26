// Bill.com API Client
// Handles authentication and API calls to Bill.com

interface BillcomConfig {
  devKey: string
  username: string
  password: string
  orgId: string
  apiUrl: string
}

interface BillcomCustomer {
  id: string
  name: string
  email: string
  phone?: string
  address?: string
}

interface BillcomInvoice {
  id: string
  invoiceNumber: string
  customerId: string
  totalAmount: number
  status: string
  createdTime: string
  dueDate: string
}

interface BillcomPaymentLink {
  paymentLink: string
  returnUrl?: string
}

interface CreateInvoiceParams {
  customerId: string
  amount: number
  description: string
  lineItems: Array<{
    description: string
    amount: number
    quantity?: number
    taxable?: boolean // Mark items as taxable
    itemId?: string // References Bill.com Item object
    isTaxItem?: boolean // NEW: Flag to identify tax line items
  }>
  dueDate: string
  invoiceNumber?: string // OPTIONAL - will query Bill.com if not provided
  itemSalesTax?: string // Tax Item ID (kept for backwards compatibility but not used)
  sendEmail?: boolean
}

class BillcomClient {
  private config: BillcomConfig
  private sessionId: string | null = null
  private userId: string | null = null // Store user ID from login
  private sessionExpiry: Date | null = null

  constructor(config: BillcomConfig) {
    this.config = config
  }

  // Authenticate with Bill.com API
  async authenticate(): Promise<string> {
    // Check if session is still valid
    if (this.sessionId && this.sessionExpiry && this.sessionExpiry > new Date()) {
      return this.sessionId
    }

    try {
      const response = await fetch(`${this.config.apiUrl}/v2/Login.json`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
        },
        body: new URLSearchParams({
          userName: this.config.username,
          password: this.config.password,
          devKey: this.config.devKey,
          orgId: this.config.orgId,
        }).toString(),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(`Bill.com authentication failed: ${error.message || response.statusText}`)
      }

      const data = await response.json()
      
      if (data.response_status !== 0) {
        throw new Error(`Bill.com authentication failed: ${data.response_data?.error_message || 'Unknown error'}`)
      }
      
      this.sessionId = data.response_data.sessionId
      this.userId = data.response_data.usersId // Store user ID for SendInvoice
      // Session expires after 35 minutes of inactivity
      this.sessionExpiry = new Date(Date.now() + 30 * 60 * 1000) // 30 minutes to be safe
      
      if (!this.sessionId) {
        throw new Error('Bill.com authentication failed: No session ID returned')
      }
      
      return this.sessionId
    } catch (error) {
      console.error('Bill.com authentication error:', error)
      throw error
    }
  }

  // Create or find a customer in Bill.com
  async createOrFindCustomer(customer: {
    name: string
    email: string
    phone?: string
    address?: string
  }): Promise<BillcomCustomer> {
    await this.authenticate()
    const apiEndpoint = 'https://api.bill.com/api/v2'

    // First try to find existing customer by email
    try {
      console.log(`Searching for customer with email: ${customer.email}`)
      
      const searchResponse = await fetch(`${apiEndpoint}/List/Customer.json`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
        },
        body: new URLSearchParams({
          devKey: this.config.devKey,
          sessionId: this.sessionId!,
          data: JSON.stringify({
            start: 0,
            max: 999
          })
        }).toString(),
      })

      const listData = await searchResponse.json()
      
      if (listData.response_status === 0 && listData.response_data) {
        // CRITICAL: Match by BOTH email AND name to avoid wrong customer
        // (e.g., if customer "Danny" has email "dantcacenco@gmail.com",
        // don't return "Dan Tcacenco" business owner account)
        const existingCustomer = listData.response_data.find((c: any) =>
          c.email?.toLowerCase() === customer.email.toLowerCase() &&
          c.name?.toLowerCase() === customer.name.toLowerCase() &&
          c.isActive === '1'
        )

        if (existingCustomer) {
          console.log(`Found existing customer: ${existingCustomer.name} (${existingCustomer.email})`)

          // Build full address from all address components (billAddress prefix)
          const addressParts = [
            existingCustomer.billAddress1,
            existingCustomer.billAddress2,
            existingCustomer.billAddressCity,
            existingCustomer.billAddressState,
            existingCustomer.billAddressZip
          ].filter(part => part && part.trim() !== '');

          return {
            id: existingCustomer.id,
            name: existingCustomer.name,
            email: existingCustomer.email,
            phone: existingCustomer.phone,
            address: addressParts.join(', ')
          }
        }

        // Also check if email exists with different name (edge case warning)
        const emailExists = listData.response_data.find((c: any) =>
          c.email?.toLowerCase() === customer.email.toLowerCase() && c.isActive === '1'
        )
        if (emailExists) {
          console.warn(`⚠️ Email ${customer.email} exists for different customer: "${emailExists.name}" (expected: "${customer.name}")`)
          console.warn(`⚠️ Will create new customer record for "${customer.name}"`)
        }
      }
    } catch (error) {
      console.warn('Error searching for customer:', error)
    }

    // Customer doesn't exist, create new one
    try {
      console.log(`Creating new customer: ${customer.name}`)

      // Parse address into Bill.com components
      // Expected format: "214 Alta Vista Dr, Candler, NC, 28715"
      let billAddress1 = ''
      let billAddressCity = ''
      let billAddressState = 'NC'
      let billAddressZip = ''

      if (customer.address) {
        const parts = customer.address.split(',').map(s => s.trim())
        if (parts.length >= 3) {
          billAddress1 = parts[0] // Street address
          billAddressCity = parts[1] // City
          // Last part might be "NC 28715" or just "28715"
          const lastPart = parts[parts.length - 1]
          const stateZipMatch = lastPart.match(/([A-Z]{2})\s*(\d{5})/)
          if (stateZipMatch) {
            billAddressState = stateZipMatch[1]
            billAddressZip = stateZipMatch[2]
          } else {
            // Try to extract just zip code
            const zipMatch = lastPart.match(/(\d{5})/)
            if (zipMatch) {
              billAddressZip = zipMatch[1]
            }
            // State might be in second-to-last part
            if (parts.length >= 4) {
              billAddressState = parts[parts.length - 2]
            }
          }
        }
      }

      console.log('Parsed address:', { billAddress1, billAddressCity, billAddressState, billAddressZip })

      const customerObj = {
        entity: 'Customer',
        isActive: '1',
        name: customer.name,
        email: customer.email,
        phone: customer.phone || '',
        billAddress1: billAddress1,
        billAddressCity: billAddressCity,
        billAddressState: billAddressState,
        billAddressZip: billAddressZip
      }

      const createResponse = await fetch(`${apiEndpoint}/Crud/Create/Customer.json`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
        },
        body: new URLSearchParams({
          devKey: this.config.devKey,
          sessionId: this.sessionId!,
          data: JSON.stringify({ obj: customerObj })
        }).toString(),
      })

      const customerData = await createResponse.json()

      if (customerData.response_status !== 0) {
        throw new Error(`Failed to create customer: ${customerData.response_data?.error_message || 'Unknown error'}`)
      }

      // Build full address from created customer data
      const createdAddressParts = [
        customerData.response_data.billAddress1,
        customerData.response_data.billAddress2,
        customerData.response_data.billAddressCity,
        customerData.response_data.billAddressState,
        customerData.response_data.billAddressZip
      ].filter(part => part && part.trim() !== '')

      return {
        id: customerData.response_data.id,
        name: customerData.response_data.name,
        email: customerData.response_data.email,
        phone: customerData.response_data.phone,
        address: createdAddressParts.join(', ')
      }
    } catch (error) {
      console.error('Error creating customer:', error)
      throw error
    }
  }

  // Create an invoice in Bill.com
  async createInvoice(params: CreateInvoiceParams): Promise<BillcomInvoice> {
    await this.authenticate()

    try {
      const apiEndpoint = 'https://api.bill.com/api/v2'
      const today = new Date().toISOString().split('T')[0]
      const dueDateStr = params.dueDate ? new Date(params.dueDate).toISOString().split('T')[0] : 
                          new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      
      // Get next invoice number from Bill.com's sequence if not provided
      // This queries Bill.com for the latest invoice number and increments it
      const invoiceNumber = params.invoiceNumber || await this.getNextInvoiceNumber()

      const invoiceObj = {
        entity: 'Invoice',
        customerId: params.customerId,
        invoiceNumber: invoiceNumber,
        invoiceDate: today,
        dueDate: dueDateStr,
        glPostingDate: today,
        description: params.description,
        terms: 'Due upon receipt',
        // NOTE: Do NOT use itemSalesTax - it doesn't work as expected
        // Instead, tax is added as a separate line item below
        invoiceLineItems: params.lineItems.map(item => ({
          entity: 'InvoiceLineItem',
          ...(item.itemId && { itemId: item.itemId }), // Reference to Bill.com Item
          amount: Number(item.amount),
          price: Number(item.amount),
          quantity: item.quantity || 1,
          description: item.description,
          // Tax items should NOT be marked as taxable (they ARE the tax)
          taxable: item.isTaxItem ? false : (item.taxable !== false),
          taxCode: item.isTaxItem ? 'Non' : (item.taxable !== false ? 'Taxable' : 'Non')
        }))
      }

      const response = await fetch(`${apiEndpoint}/Crud/Create/Invoice.json`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
        },
        body: new URLSearchParams({
          devKey: this.config.devKey,
          sessionId: this.sessionId!,
          data: JSON.stringify({ obj: invoiceObj })
        }).toString(),
      })

      const invoiceData = await response.json()

      if (invoiceData.response_status !== 0) {
        throw new Error(`Failed to create invoice: ${invoiceData.response_data?.error_message || 'Unknown error'}`)
      }

      return {
        id: invoiceData.response_data.id,
        invoiceNumber: invoiceData.response_data.invoiceNumber,
        customerId: params.customerId,
        totalAmount: params.amount,
        status: invoiceData.response_data.paymentStatus || 'PENDING',
        createdTime: invoiceData.response_data.createdTime,
        dueDate: invoiceData.response_data.dueDate
      }
    } catch (error) {
      console.error('Error creating invoice:', error)
      throw error
    }
  }

  // Get next sequential invoice number (queries Bill.com for latest)
  // Format: 4-digit sequential (2065, 2066, 2067...)
  async getNextInvoiceNumber(startingNumber: number = 2065): Promise<string> {
    await this.authenticate()

    try {
      const apiEndpoint = 'https://api.bill.com/api/v2'

      // Query Bill.com for latest invoices sorted by date (source of truth)
      const response = await fetch(`${apiEndpoint}/List/Invoice.json`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
        },
        body: new URLSearchParams({
          devKey: this.config.devKey,
          sessionId: this.sessionId!,
          data: JSON.stringify({
            start: 0,
            max: 999,
            sort: [{
              field: 'invoiceDate',
              asc: false
            }]
          })
        }).toString(),
      })

      const data = await response.json()

      if (data.response_status !== 0) {
        console.warn('Could not fetch invoices from Bill.com, using starting number:', startingNumber)
        return startingNumber.toString()
      }

      // Start from 2065 baseline (or the highest existing 4-digit invoice, whichever is greater)
      let highestNumber = startingNumber - 1
      const invoices = data.response_data || []

      console.log(`Checking ${invoices.length} invoices from Bill.com...`)
      console.log(`Baseline starting number: ${startingNumber}`)

      // Filter to only 4-digit invoice numbers and find the highest
      for (const invoice of invoices) {
        const invoiceNum = invoice.invoiceNumber
        const num = parseInt(invoiceNum)

        // Only consider 4-digit numbers (e.g., 2065, 2066...)
        if (!isNaN(num) && invoiceNum.length === 4 && num >= 2000 && num <= 9999) {
          if (num > highestNumber) {
            highestNumber = num
            console.log(`  Found 4-digit invoice: ${invoiceNum} (date: ${invoice.invoiceDate})`)
          }
        }
      }

      // Ensure we never go below 2065
      if (highestNumber < startingNumber - 1) {
        highestNumber = startingNumber - 1
        console.log(`  No existing 4-digit invoices found, starting from ${startingNumber}`)
      }

      const nextNumber = (highestNumber + 1).toString()
      console.log(`✅ Highest 4-digit invoice found: ${highestNumber}, Next number: ${nextNumber}`)
      
      // Update database counter to stay in sync
      try {
        const { createClient } = await import('@/lib/supabase/server')
        const supabase = await createClient()
        
        await supabase
          .from('invoice_counter')
          .update({ 
            last_invoice_number: highestNumber,
            updated_at: new Date().toISOString()
          })
          .eq('id', 1)
        
        console.log(`✅ Database counter synced to ${highestNumber}`)
      } catch (dbError) {
        console.warn('Failed to update database counter (non-critical):', dbError)
      }
      
      return nextNumber
    } catch (error) {
      console.error('Error getting next invoice number:', error)
      throw error
    }
  }

  // Get payment link for an invoice
  async getPaymentLink(
    invoiceId: string,
    customerEmail: string,
    returnUrl?: string
  ): Promise<BillcomPaymentLink> {
    await this.authenticate()

    try {
      const response = await fetch(
        `${this.config.apiUrl}/connect/v3/invoices/${invoiceId}/payment-link`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'devKey': this.config.devKey,
            'sessionId': this.sessionId!,
          },
          body: JSON.stringify({
            customerId: invoiceId.substring(0, 3) === '0cu' ? invoiceId : undefined,
            email: customerEmail,
            returnUrl: returnUrl,
          }),
        }
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(`Failed to get payment link: ${error.message || response.statusText}`)
      }

      const linkData = await response.json()
      return linkData
    } catch (error) {
      console.error('Error getting payment link:', error)
      throw error
    }
  }

  // Get invoice details
  async getInvoice(invoiceId: string): Promise<BillcomInvoice> {
    await this.authenticate()

    try {
      const response = await fetch(
        `${this.config.apiUrl}/connect/v3/invoices/${invoiceId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'devKey': this.config.devKey,
            'sessionId': this.sessionId!,
          },
        }
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(`Failed to get invoice: ${error.message || response.statusText}`)
      }

      const invoice = await response.json()
      return invoice
    } catch (error) {
      console.error('Error getting invoice:', error)
      throw error
    }
  }

  // Record a manual payment (for tracking purposes)
  async recordPayment(invoiceId: string, amount: number, paymentDate: string): Promise<any> {
    await this.authenticate()

    try {
      const response = await fetch(
        `${this.config.apiUrl}/connect/v3/invoices/record-payment`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'devKey': this.config.devKey,
            'sessionId': this.sessionId!,
          },
          body: JSON.stringify({
            invoices: [{
              id: invoiceId,
              amount: amount,
            }],
            amount: amount,
            paymentDate: paymentDate,
            paymentType: 'ONLINE',
            description: 'Payment received through Bill.com payment link',
          }),
        }
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(`Failed to record payment: ${error.message || response.statusText}`)
      }

      const payment = await response.json()
      return payment
    } catch (error) {
      console.error('Error recording payment:', error)
      throw error
    }
  }

  // Send invoice email to customer via Bill.com
  async sendInvoice(invoiceId: string, customerEmail?: string): Promise<{ success: boolean; message: string }> {
    await this.authenticate()

    try {
      console.log(`📧 Sending invoice ${invoiceId} via Bill.com...`)

      // Fetch invoice details to get invoice number and customer info
      let invoiceNumber = 'Invoice';
      let recipientEmail = customerEmail;

      if (!recipientEmail) {
        // If no email provided, fetch invoice to get customer email
        const invoiceResponse = await fetch(`${this.config.apiUrl}/v2/Crud/Read/Invoice.json`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json',
          },
          body: new URLSearchParams({
            devKey: this.config.devKey,
            sessionId: this.sessionId!,
            data: JSON.stringify({ id: invoiceId })
          }).toString(),
        });

        const invoiceData = await invoiceResponse.json();
        if (invoiceData.response_status === 0 && invoiceData.response_data) {
          invoiceNumber = invoiceData.response_data.invoiceNumber || invoiceNumber;
          const customerId = invoiceData.response_data.customerId;

          // Fetch customer to get email
          if (customerId) {
            const customerResponse = await fetch(`${this.config.apiUrl}/v2/Crud/Read/Customer.json`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/json',
              },
              body: new URLSearchParams({
                devKey: this.config.devKey,
                sessionId: this.sessionId!,
                data: JSON.stringify({ id: customerId })
              }).toString(),
            });

            const customerData = await customerResponse.json();
            if (customerData.response_status === 0 && customerData.response_data?.email) {
              recipientEmail = customerData.response_data.email;
            }
          }
        }
      }

      if (!recipientEmail) {
        throw new Error('Customer email is required to send invoice');
      }

      // Build the data object according to Bill.com API specs
      // REQUIRED fields based on Bill.com v2 API documentation:
      // - headers.fromUserId: User ID of sender
      // - headers.toEmailAddresses: Array of recipient emails
      // - headers.subject: Email subject line
      // - content.body: Email body text
      const invoiceData: {
        invoiceId: string
        headers: Record<string, any>
        content: Record<string, any>
      } = {
        invoiceId: invoiceId,
        headers: {
          fromUserId: this.userId!, // REQUIRED: Bill.com needs to know who is sending
          toEmailAddresses: [recipientEmail], // REQUIRED: Recipient email addresses
          ccMe: false,
          subject: `Invoice #${invoiceNumber} from Fair Air Heating & Cooling` // REQUIRED: Email subject
        },
        content: {
          body: `Thank you for your business! Please find your invoice attached.\n\nInvoice #${invoiceNumber}\n\nClick the link below to view and pay your invoice online.` // REQUIRED: Email body
        }
      }

      const response = await fetch(`${this.config.apiUrl}/v2/SendInvoice.json`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
        },
        body: new URLSearchParams({
          devKey: this.config.devKey,
          sessionId: this.sessionId!,
          data: JSON.stringify(invoiceData)
        }).toString(),
      })

      const data = await response.json()

      if (data.response_status !== 0) {
        console.error(`❌ Failed to send invoice: ${data.response_message}`)
        throw new Error(`Failed to send invoice: ${data.response_message || 'Unknown error'}`)
      }

      console.log(`✅ Invoice ${invoiceId} sent successfully via Bill.com to ${recipientEmail}`)
      return {
        success: true,
        message: 'Invoice sent successfully'
      }
    } catch (error) {
      console.error('Error sending invoice:', error)
      throw error
    }
  }

  // Get invoice PDF from Bill.com
  async getInvoicePdf(invoiceId: string): Promise<Buffer | null> {
    await this.authenticate()

    try {
      console.log(`📄 Fetching PDF for invoice ${invoiceId}...`)

      // Bill.com PDF endpoint: /Invoice2PdfServlet?Id={invoice_id}&PresentationType=PDF
      const pdfUrl = `${this.config.apiUrl}/Invoice2PdfServlet?Id=${invoiceId}&PresentationType=PDF`

      const response = await fetch(pdfUrl, {
        method: 'GET',
        headers: {
          'Cookie': `sessionId=${this.sessionId}`,
          'devKey': this.config.devKey,
        },
      })

      if (!response.ok) {
        console.error(`❌ Failed to fetch invoice PDF: ${response.statusText}`)
        return null
      }

      const arrayBuffer = await response.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)

      console.log(`✅ Invoice PDF fetched (${buffer.length} bytes)`)
      return buffer
    } catch (error) {
      console.error('Error fetching invoice PDF:', error)
      return null
    }
  }
}

// Create singleton instance
let billcomClient: BillcomClient | null = null
let lastCredentialsHash: string | null = null

/**
 * Get Bill.com client with credentials from env or database
 * Supports dynamic credential updates without restart
 */
export async function getBillcomClientAsync(): Promise<BillcomClient> {
  // Import credentials module dynamically to avoid circular deps
  const { getBillcomCredentials } = await import('./credentials')

  try {
    const { credentials, source } = await getBillcomCredentials()

    // Create hash to detect credential changes
    const credHash = `${credentials.devKey}:${credentials.username}:${credentials.password}:${credentials.orgId}`

    // Return existing client if credentials haven't changed
    if (billcomClient && lastCredentialsHash === credHash) {
      return billcomClient
    }

    // Create new client with fresh credentials
    const config: BillcomConfig = {
      devKey: credentials.devKey,
      username: credentials.username,
      password: credentials.password,
      orgId: credentials.orgId,
      apiUrl: credentials.apiUrl || 'https://api.bill.com/api/v2',
    }

    console.log(`[BillcomClient] Creating client with credentials from: ${source}`)
    billcomClient = new BillcomClient(config)
    lastCredentialsHash = credHash

    return billcomClient
  } catch (error) {
    console.error('[BillcomClient] Failed to get credentials:', error)
    throw error
  }
}

/**
 * Synchronous version - uses env vars only (for backward compatibility)
 * @deprecated Use getBillcomClientAsync() for database credential support
 */
export function getBillcomClient(): BillcomClient {
  if (!billcomClient) {
    const config: BillcomConfig = {
      devKey: process.env.BILLCOM_DEV_KEY!,
      username: process.env.BILLCOM_USERNAME!,
      password: process.env.BILLCOM_PASSWORD!,
      orgId: process.env.BILLCOM_ORG_ID!,
      apiUrl: process.env.BILLCOM_API_URL || 'https://api.bill.com/api/v2',
    }

    if (!config.devKey || !config.username || !config.password || !config.orgId) {
      throw new Error('Bill.com configuration is incomplete. Please check environment variables.')
    }

    billcomClient = new BillcomClient(config)
  }

  return billcomClient
}

/**
 * Reset the singleton client (call after credential updates)
 */
export function resetBillcomClient(): void {
  billcomClient = null
  lastCredentialsHash = null
}

// Export the class for direct instantiation in test/setup endpoints
export { BillcomClient }
export type { BillcomCustomer, BillcomInvoice, BillcomPaymentLink, CreateInvoiceParams, BillcomConfig }
