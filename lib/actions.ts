'use server';

import connectDB from '@/lib/mongodb';
import Task from '@/models/Task';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';

export async function registerUser(formData: FormData) {
  try {
    await connectDB();

    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    const userExists = await User.findOne({ email });
    if (userExists) return { error: "User already exists" };

    const hashedPassword = await bcrypt.hash(password, 10);

    await User.create({
      name,
      email,
      password: hashedPassword,
    });

    return { success: true };
  } catch (err: any) {
    return { error: err.message || "Registration failed" };
  }
}

export async function createTask(formData: FormData) {
  const session = await auth();
  if (!session || !session.user) {
    throw new Error("You must be logged in to create a task.");
  }

  await connectDB();

  const title = formData.get('title');
  const description = formData.get('description');
  const priority = formData.get('priority');
  const column = formData.get('column') || 'To Do';

  await Task.create({
    title,
    description,
    priority,
    column,
    userId: session.user.id,
  });

  revalidatePath('/'); 
}

export async function deleteTask(id: string) {
  const session = await auth();
  if (!session || !session.user) {
    throw new Error("Unauthorized");
  }

  await connectDB();
  await Task.findOneAndDelete({ _id: id, userId: session.user.id });
  revalidatePath('/');
}

export async function updateTaskTitle(id: string, title: string) {
  const session = await auth();
  if (!session || !session.user) {
    throw new Error("Unauthorized");
  }

  await connectDB();
  await Task.findOneAndUpdate({ _id: id, userId: session.user.id }, { title });
  revalidatePath('/');
}

export async function updateTaskDescription(id: string, description: string) {
  const session = await auth();
  if (!session || !session.user) {
    throw new Error("Unauthorized");
  }

  await connectDB();
  await Task.findOneAndUpdate({ _id: id, userId: session.user.id }, { description });
  revalidatePath('/');
}

export async function addColumn(name: string) {
  const session = await auth();
  if (!session || !session.user) return;
  
  await connectDB();
  await User.findByIdAndUpdate(session.user.id, {
    $addToSet: { columns: name } // Prevent duplicate column names
  });
  revalidatePath('/');
}

export async function updateTaskStatus(taskId: string, newColumn: string) {
  await connectDB();
  await Task.findByIdAndUpdate(taskId, { column: newColumn });
  revalidatePath('/');
}

export async function toggleTaskComplete(taskId: string, completed: boolean) {
  await connectDB();
  await Task.findByIdAndUpdate(taskId, { completed });
  revalidatePath('/');
}

export async function updateTaskOrders(updates: { id: string, column: string, order: number }[]) {
  const session = await auth();
  if (!session || !session.user) return;
  
  await connectDB();
  
  const bulkOps = updates.map(update => ({
    updateOne: {
      filter: { _id: update.id, userId: session.user.id },
      update: { $set: { column: update.column, order: update.order } }
    }
  }));

  if (bulkOps.length > 0) {
    await Task.bulkWrite(bulkOps);
  }
  revalidatePath('/');
}
