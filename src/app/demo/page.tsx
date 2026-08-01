import { redirect } from 'next/navigation';

// La demo del cliente tipado se reemplazo por la app real. Se redirige al home.
export default function DemoPage() {
  redirect('/');
}
