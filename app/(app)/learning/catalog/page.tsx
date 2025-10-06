import { Suspense } from 'react';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import CourseCard from '@/components/learning/CourseCard';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

async function CatalogContent({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  const session = await getServerSession(authOptions);
  const tenantId = (session?.user as any)?.tenantId || null;
  const q = (searchParams.q as string) || '';
  const category = (searchParams.category as string) || undefined;
  const level = (searchParams.level as string) || undefined;

  const where: any = { isPublished: true };
  if (tenantId) where.tenantId = tenantId;
  if (q) where.title = { contains: q, mode: 'insensitive' };
  if (category) where.category = category;
  if (level) where.level = level;

  const courses = await prisma.course.findMany({ where, orderBy: { createdAt: 'desc' } });
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <Input name="q" defaultValue={q} placeholder="Поиск по названию" />
        <Input name="category" defaultValue={category} placeholder="Категория" />
        <Select name="level" defaultValue={level}>
          <SelectTrigger><SelectValue placeholder="Уровень" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="beginner">beginner</SelectItem>
            <SelectItem value="intermediate">intermediate</SelectItem>
            <SelectItem value="advanced">advanced</SelectItem>
          </SelectContent>
        </Select>
        <Button type="submit" formAction="/learning/catalog">Фильтровать</Button>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {courses.map((c)=> (
          <CourseCard key={c.id} id={c.id} title={c.title} description={c.description} category={c.category || undefined} level={c.level || undefined} coverUrl={c.coverUrl || undefined} action={{ label: 'Начать', href: `/learning/${c.id}` }} />
        ))}
      </div>
    </div>
  );
}

export default async function CatalogPage({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-semibold mb-6">Каталог курсов</h1>
        <Suspense>
          <CatalogContent searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  );
}

