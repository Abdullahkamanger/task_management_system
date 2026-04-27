'use server';

import connectDB from '@/lib/mongodb';
import Task from '@/models/Task';
import { revalidatePath } from 'next/cache';

export async function createTask(formData: FormData) {
  await connectDB();

  const title = formData.get('title');
  const description = formData.get('description');
  const priority = formData.get('priority');

  // For now, we use a hardcoded UserID until you add Auth
  // Replace this with a real ID from your MongoDB User collection
  const mockUserId = "65f1a2b3c4d5e6f7a8b9c0d1"; 

  await Task.create({
    title,
    description,
    priority,
    userId: mockUserId,
  });

  // This magic function tells Next.js to refresh the data on the page
  revalidatePath('/'); 
}


export async function deleteTask(id: string) {
  await connectDB();
  await Task.findByIdAndDelete(id);
  revalidatePath('/');
}