import { redirect } from 'next/navigation';

// Los diagramas viven ahora bajo el submenu "Anual".
export default function DiagramasIndexPage() {
  redirect('/diagramas/anual');
}
