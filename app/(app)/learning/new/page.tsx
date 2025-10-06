import { redirect } from 'next/navigation';
import CourseForm from '@/components/learning/CourseForm';
import { createCourseAction } from '../actions';

export default function NewCoursePage() {
  async function createCourse(formData: FormData) {
    'use server';
    const data = Object.fromEntries(formData);
    const course = await createCourseAction(data);
    redirect(`/learning/${course.id}`);
  }

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-semibold mb-6">Создание курса</h1>
        <CourseForm action={createCourse} />
      </div>
    </div>
  );
}

