"use client";
import { Control, UseFieldArrayReturn, useFieldArray } from 'react-hook-form';
import { CourseCreateInput, lessonTypeEnum } from '@/lib/validators/learning';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

type Props = {
  control: Control<CourseCreateInput>;
  modulesArray: UseFieldArrayReturn<CourseCreateInput, 'modules', 'id'>;
};

export function ModuleEditor({ control, modulesArray }: Props) {
  const { fields, append, remove } = modulesArray;

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <CardTitle>Структура курса</CardTitle>
        <Button type="button" onClick={() => append({ title: 'Новый модуль', order: fields.length, lessons: [] })}>Добавить модуль</Button>
      </CardHeader>
      <CardContent className="space-y-6">
        {fields.map((moduleField, moduleIndex) => (
          <div key={moduleField.id} className="rounded-lg border p-4">
            <div className="mb-3 flex gap-2">
              <Input {...(control.register as any)(`modules.${moduleIndex}.title`)} placeholder="Название модуля" />
              <Button type="button" variant="ghost" onClick={() => remove(moduleIndex)}>Удалить</Button>
            </div>
            <ModuleLessons control={control} moduleIndex={moduleIndex} />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function ModuleLessons({ control, moduleIndex }: { control: Control<CourseCreateInput>; moduleIndex: number }) {
  const lessons = useFieldArray({ control, name: `modules.${moduleIndex}.lessons` as const });
  return (
    <div className="space-y-3">
      {lessons.fields.map((lf, lessonIndex) => (
        <div key={lf.id} className="rounded-md border p-3 space-y-2">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <Input {...(control.register as any)(`modules.${moduleIndex}.lessons.${lessonIndex}.title`)} placeholder="Название урока" />
            <Select onValueChange={(v)=> (control.setValue as any)(`modules.${moduleIndex}.lessons.${lessonIndex}.type`, v)}>
              <SelectTrigger><SelectValue placeholder="Тип" /></SelectTrigger>
              <SelectContent>
                {lessonTypeEnum.options.map((t)=> <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input {...(control.register as any)(`modules.${moduleIndex}.lessons.${lessonIndex}.order`, { valueAsNumber: true })} placeholder="Порядок" type="number" />
          </div>
          <Textarea {...(control.register as any)(`modules.${moduleIndex}.lessons.${lessonIndex}.content`)} placeholder="Контент/URL" />
          <Button type="button" variant="ghost" onClick={()=> lessons.remove(lessonIndex)}>Удалить урок</Button>
        </div>
      ))}
      <Button type="button" variant="outline" onClick={()=> lessons.append({ title: 'Новый урок', type: 'TEXT', order: lessons.fields.length })}>Добавить урок</Button>
    </div>
  );
}

