import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DollarSign, TrendingDown, PiggyBank, CheckCircle, ExternalLink, Clock, Users, TrendingUp, Heart } from 'lucide-react'

interface SavingItem {
  service: string
  description: string
  monthlySavings: number
  yearlyTarget: string
  icon: string
  pricingUrl: string
}

const savingsData: SavingItem[] = [
  {
    service: 'Automation Time Savings',
    description: 'Heavy automation saves 4 hours/week of manual work ($100-200/week)',
    monthlySavings: 600,
    yearlyTarget: '$7,200',
    icon: '⚡',
    pricingUrl: '#time-value' // Internal link to section below
  },
  {
    service: 'County Tax Reporting',
    description: 'Custom NC county tax breakdown vs TaxJar Professional (conservative)',
    monthlySavings: 99,
    yearlyTarget: '$1,188',
    icon: '📊',
    pricingUrl: 'https://www.taxjar.com/pricing'
  },
  {
    service: 'ConnectTeam',
    description: 'Manual Excel import vs API subscription',
    monthlySavings: 99,
    yearlyTarget: '$1,188',
    icon: '📋',
    pricingUrl: 'https://connecteam.com/pricing/'
  },
  {
    service: 'Supabase Database',
    description: 'Self-hosted PostgreSQL vs managed cloud service',
    monthlySavings: 55,
    yearlyTarget: '$660',
    icon: '🗄️',
    pricingUrl: 'https://supabase.com/pricing'
  },
  {
    service: 'Proposify',
    description: 'Custom proposal system vs proposal software (with integrations)',
    monthlySavings: 49,
    yearlyTarget: '$588',
    icon: '📄',
    pricingUrl: 'https://www.proposify.com/pricing'
  },
  {
    service: 'Sortly',
    description: 'Custom inventory tracking vs paid software',
    monthlySavings: 24,
    yearlyTarget: '$288',
    icon: '📦',
    pricingUrl: 'https://www.sortly.com/pricing/'
  }
]

const totalMonthly = savingsData.reduce((sum, item) => sum + item.monthlySavings, 0)
const totalYearly = totalMonthly * 12

export default async function SavingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/signin')
  }

  // Check user role - only boss/admin can view savings
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || (profile.role !== 'boss' && profile.role !== 'admin')) {
    redirect('/dashboard')
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Cost Savings Dashboard</h1>
          <p className="text-gray-600 mt-1">Track monthly and annual savings from DIY solutions</p>
        </div>
        <PiggyBank className="h-12 w-12 text-green-600" />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-800">Monthly Savings</p>
              <p className="text-3xl font-bold text-green-900 mt-2">${totalMonthly}</p>
            </div>
            <TrendingDown className="h-10 w-10 text-green-600" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-800">Annual Savings</p>
              <p className="text-3xl font-bold text-blue-900 mt-2">${totalYearly.toLocaleString()}</p>
            </div>
            <DollarSign className="h-10 w-10 text-blue-600" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-800">Services Replaced</p>
              <p className="text-3xl font-bold text-purple-900 mt-2">{savingsData.length}</p>
            </div>
            <CheckCircle className="h-10 w-10 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Savings Breakdown */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Savings Breakdown</h2>
          <p className="text-sm text-gray-600 mt-1">Detailed breakdown of each cost optimization</p>
        </div>

        <div className="divide-y divide-gray-200">
          {savingsData.map((item, index) => (
            <div key={index} className="p-6 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <div className="text-3xl">{item.icon}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900 text-lg">{item.service}</h3>
                      <a
                        href={item.pricingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 transition-colors"
                        title="View pricing"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                    <div className="flex items-center gap-4 mt-3">
                      <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                        ${item.monthlySavings}/month saved
                      </div>
                      <div className="text-sm text-gray-500">
                        {item.yearlyTarget} annually
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-green-600">
                    ${item.monthlySavings}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">per month</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Total Row */}
        <div className="bg-gray-50 p-6 border-t-2 border-gray-300">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Total Savings</h3>
              <p className="text-sm text-gray-600 mt-1">Combined monthly and annual savings</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-green-600">${totalMonthly.toLocaleString()}/mo</div>
              <div className="text-lg text-gray-700 mt-1">${totalYearly.toLocaleString()}/year</div>
            </div>
          </div>
        </div>
      </div>

      {/* Time Value Section */}
      <div id="time-value" className="bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Clock className="h-6 w-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">What You Can Do With 4 Extra Hours Per Week</h2>
              <p className="text-sm text-gray-600 mt-1">The real value of automation goes beyond cost savings</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Work-Life Balance */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-5">
              <div className="flex items-start gap-3">
                <Heart className="h-8 w-8 text-purple-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-purple-900 text-lg mb-2">Work-Life Balance</h3>
                  <p className="text-sm text-purple-800 leading-relaxed">
                    Leave work early to catch your son&apos;s basketball games. Spend more time with family.
                    Enjoy the fruits of your labor without sacrificing business performance.
                  </p>
                </div>
              </div>
            </div>

            {/* Business Growth */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg p-5">
              <div className="flex items-start gap-3">
                <TrendingUp className="h-8 w-8 text-green-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-green-900 text-lg mb-2">Revenue Growth</h3>
                  <p className="text-sm text-green-800 leading-relaxed">
                    Meet one extra potential client every week. At typical conversion rates, this could mean
                    <strong> $2,000-5,000 in additional monthly revenue</strong> from new projects.
                  </p>
                </div>
              </div>
            </div>

            {/* Team Expansion */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-5">
              <div className="flex items-start gap-3">
                <Users className="h-8 w-8 text-blue-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-blue-900 text-lg mb-2">Team Expansion</h3>
                  <p className="text-sm text-blue-800 leading-relaxed">
                    Invest time in hiring and training new employees. Scale your operations without being
                    bottlenecked by administrative tasks. Build the team you&apos;ve always envisioned.
                  </p>
                </div>
              </div>
            </div>

            {/* Strategic Planning */}
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-lg p-5">
              <div className="flex items-start gap-3">
                <DollarSign className="h-8 w-8 text-orange-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-orange-900 text-lg mb-2">Strategic Focus</h3>
                  <p className="text-sm text-orange-800 leading-relaxed">
                    Focus on high-level strategy and business development instead of manual data entry.
                    Work <em>on</em> your business, not just <em>in</em> your business.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Summary */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-900 leading-relaxed">
              <strong>Bottom Line:</strong> Four hours per week equals 208 hours per year. That&apos;s the equivalent
              of <strong>5 full work weeks</strong> reclaimed annually. Use it to grow revenue, expand your team,
              or simply enjoy life more. The automation pays for itself many times over.
            </p>
          </div>
        </div>
      </div>

      {/* Philosophy Note */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <PiggyBank className="h-6 w-6 text-blue-600 mt-1 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-blue-900 mb-2">Bootstrap Philosophy</h3>
            <p className="text-sm text-blue-800 leading-relaxed">
              By building custom solutions, heavy automation, and leveraging open-source tools, we&apos;re saving <strong>${totalMonthly.toLocaleString()} every month</strong> (${totalYearly.toLocaleString()} annually).
              This reinvestment in our own development capabilities makes us more agile, gives us complete control over our data,
              and builds institutional knowledge that compounds over time. The automation alone saves 4 hours of manual work every week.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
