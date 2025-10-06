"use client";
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { courseCreateSchema, CourseCreateInput, lessonTypeEnum, levelEnum } from '@/lib/validators/learning';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ModuleEditor } from './ModuleEditor';

type Props = { onSubmit: (data: CourseCreateInput) => Promise<void> };

export default function CourseForm({ onSubmit }: Props) {
  const form = useForm<CourseCreateInput>({ resolver: zodResolver(courseCreateSchema), defaultValues: { modules: [], isPublished: false, visibility: 'ALL', defaultQuestionMode: 'CHOICE' } });
  const { control, register, handleSubmit, formState: { isSubmitting } } = form;
  const modulesArray = useFieldArray({ control, name: 'modules' });

  return (
    <form onSubmit={handleSubmit(async (data) => { await onSubmit(data); })} className="grid gap-6 md:grid-cols-5">
      <div className="md:col-span-3 space-y-6">
        <Card>
          <CardHeader><CardTitle>Основная информация</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Input placeholder="Название" {...register('title')} />
            <Textarea placeholder="Описание" {...register('description')} />
            <div className="grid grid-cols-2 gap-4">
              <Input placeholder="Категория" {...register('category')} />
              <Select onValueChange={(v)=> form.setValue('level', v as any)}>
                <SelectTrigger><SelectValue placeholder="Уровень" /></SelectTrigger>
                <SelectContent>
                  {levelEnum.options.map((l)=> <SelectItem key={l} value={l}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
              <Input type="number" placeholder="Длительность (мин)" {...register('durationMin', { valueAsNumber: true })} />
              <Input placeholder="URL обложки" {...register('coverUrl')} />
              <Select onValueChange={(v)=> form.setValue('visibility', v as any)}>
                <SelectTrigger><SelectValue placeholder="Доступ" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Все сотрудники</SelectItem>
                  <SelectItem value='["EMPLOYEE"]'>Только EMPLOYEE</SelectItem>
                  <SelectItem value='["MANAGER"]'>Только MANAGER</SelectItem>
                  <SelectItem value='["OWNER"]'>Только OWNER</SelectItem>
                </SelectContent>
              </Select>
              <Input type="date" placeholder="Срок прохождения" onChange={(e)=> form.setValue('dueDate', e.target.value ? new Date(e.target.value).toISOString() : undefined)} />
              <Select onValueChange={(v)=> form.setValue('defaultQuestionMode', v as any)}>
                <SelectTrigger><SelectValue placeholder="Тип вопросов по умолчанию" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="CHOICE">Выбор из вариантов</SelectItem>
                  <SelectItem value="INPUT">Ввод текста</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <ModuleEditor control={control} modulesArray={modulesArray} />
      </div>
      <div className="md:col-span-2 space-y-4">
        <Card>
          <CardHeader><CardTitle>Действия</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Button type="submit" disabled={isSubmitting}>Сохранить черновик</Button>
            <Button type="button" variant="outline" disabled={isSubmitting} onClick={handleSubmit(async (d)=>{d.isPublished=true; await onSubmit(d);})}>Опубликовать</Button>
          </CardContent>
        </Card>
      </div>
    </form>
  );
}

