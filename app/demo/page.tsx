import { redirect } from 'next/navigation';

export default function DemoPage() {
  // Redirect /demo to /demo/dashboard
  redirect('/demo/dashboard');
}
