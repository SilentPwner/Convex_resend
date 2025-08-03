import { auth } from '@clerk/nextjs';

export async function checkAdminRole() {
  const { sessionClaims } = auth();
  
  // في تطبيق حقيقي، قد يكون هذا من قاعدة البيانات أو نظام المصادقة
  return sessionClaims?.metadata.role === 'admin';
}