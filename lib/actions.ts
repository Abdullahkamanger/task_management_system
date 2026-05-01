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

export async function createTask(data: FormData | { title: string, description?: string, priority?: string, column?: string, dueDate?: string | null }) {
  const session = await auth();
  if (!session || !session.user) {
    throw new Error("You must be logged in to create a task.");
  }

  await connectDB();

  let title, description, priority, column, dueDate, parentId;

  if (data instanceof FormData) {
    title = data.get('title');
    description = data.get('description');
    priority = data.get('priority');
    column = data.get('column') || 'To Do';
    dueDate = data.get('dueDate');
    parentId = data.get('parentId');
  } else {
    title = data.title;
    description = data.description;
    priority = data.priority || 'medium';
    column = data.column || 'To Do';
    dueDate = data.dueDate;
    parentId = (data as any).parentId;
  }

  await Task.create({
    title,
    description,
    priority,
    column,
    userId: session.user.id,
    parentId: parentId || null,
    dueDate: (dueDate && dueDate !== "") ? (() => {
      const dateStr = dueDate as string;
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        const [y, m, d] = dateStr.split('-').map(Number);
        return new Date(y, m - 1, d); // Parse as local date
      }
      return new Date(dateStr);
    })() : undefined,
  });

  revalidatePath('/'); 
  revalidatePath('/tasks');
  revalidatePath('/calendar');
  revalidatePath('/inbox');
}

export async function deleteTask(id: string) {
  const session = await auth();
  if (!session || !session.user) {
    throw new Error("Unauthorized");
  }

  await connectDB();
  await Task.findOneAndDelete({ _id: id, userId: session.user.id });
  revalidatePath('/');
  revalidatePath('/tasks');
  revalidatePath('/calendar');
  revalidatePath('/inbox');
}

export async function updateTaskTitle(id: string, title: string) {
  const session = await auth();
  if (!session || !session.user) {
    throw new Error("Unauthorized");
  }

  await connectDB();
  await Task.findOneAndUpdate({ _id: id, userId: session.user.id }, { title });
  revalidatePath('/');
  revalidatePath('/tasks');
  revalidatePath('/calendar');
  revalidatePath('/inbox');
}

export async function updateTaskDescription(id: string, description: string) {
  const session = await auth();
  if (!session || !session.user) {
    throw new Error("Unauthorized");
  }

  await connectDB();
  await Task.findOneAndUpdate({ _id: id, userId: session.user.id }, { description });
  revalidatePath('/');
  revalidatePath('/tasks');
  revalidatePath('/calendar');
  revalidatePath('/inbox');
}

export async function addColumn(name: string) {
  const session = await auth();
  if (!session || !session.user) return;
  
  await connectDB();
  await User.findByIdAndUpdate(session.user.id, {
    $addToSet: { columns: { name } } 
  });
  revalidatePath('/');
}

export async function deleteColumn(name: string) {
  if (!name) return;
  const session = await auth();
  if (!session || !session.user) return;

  await connectDB();
  
  // 1. Remove column from user
  await User.findByIdAndUpdate(session.user.id, {
    $pull: { columns: { name: name } }
  });

  // 2. Delete all tasks in that column for this user
  await Task.deleteMany({ column: name, userId: session.user.id });

  revalidatePath('/');
  revalidatePath('/tasks');
  revalidatePath('/calendar');
  revalidatePath('/inbox');
}

export async function updateColumnDate(columnName: string, date: string | null) {
  const session = await auth();
  if (!session || !session.user) return;

  await connectDB();
  await User.findOneAndUpdate(
    { _id: session.user.id, "columns.name": columnName },
    { $set: { "columns.$.dueDate": date ? new Date(date) : null } }
  );

  revalidatePath('/');
}

export async function updateTaskDate(taskId: string, date: string | null) {
  const session = await auth();
  if (!session || !session.user) return;

  await connectDB();
  await Task.findOneAndUpdate(
    { _id: taskId, userId: session.user.id },
    { $set: { dueDate: date ? new Date(date) : null } }
  );

  revalidatePath('/');
  revalidatePath('/tasks');
  revalidatePath('/calendar');
  revalidatePath('/inbox');
}

export async function updateTaskStatus(taskId: string, newColumn: string) {
  await connectDB();
  await Task.findByIdAndUpdate(taskId, { column: newColumn });
  revalidatePath('/');
  revalidatePath('/tasks');
  revalidatePath('/calendar');
  revalidatePath('/inbox');
}

export async function toggleTaskComplete(taskId: string, completed: boolean) {
  const session = await auth();
  if (!session || !session.user) return;

  await connectDB();
  const task = await Task.findOneAndUpdate(
    { _id: taskId, userId: session.user.id },
    { completed },
    { new: true }
  );

  if (task) {
    // Cascading: If parent is toggled, update all subtasks
    await Task.updateMany(
      { parentId: taskId, userId: session.user.id },
      { completed }
    );

    // If subtask is toggled, check siblings and update parent
    if (task.parentId) {
      const allSiblings = await Task.find({ parentId: task.parentId, userId: session.user.id });
      const allCompleted = allSiblings.every(t => t.completed);
      
      await Task.updateOne(
        { _id: task.parentId, userId: session.user.id },
        { completed: allCompleted }
      );
    }
  }

  revalidatePath('/');
  revalidatePath('/tasks');
  revalidatePath('/calendar');
  revalidatePath('/inbox');
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
  revalidatePath('/tasks');
  revalidatePath('/calendar');
  revalidatePath('/inbox');
}
