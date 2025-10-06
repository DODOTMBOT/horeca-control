import { redirect } from 'next/navigation';
import CourseForm from '@/components/learning/CourseForm';
import { createCourseAction } from '../actions';

export default function NewCoursePage() {
  async function onSubmit(data: any) {
    'use server';
    const course = await createCourseAction(data);
    redirect(`/learning/${course.id}`);
  }

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-semibold mb-6">Создание курса</h1>
        {/* @ts-expect-error Server Action passed */}
        <CourseForm onSubmit={onSubmit} />
      </div>
    </div>
  );
}

