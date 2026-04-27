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

  await Task.create({
    title,
    description,
    priority,
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