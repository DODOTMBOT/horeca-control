"use client";
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type Props = {
  action: (formData: FormData) => Promise<any>;
};

export default function CourseForm({ action }: Props) {
  return (
    <form action={action} className="grid gap-6 md:grid-cols-5">
      <div className="md:col-span-3 space-y-6">
        <Card>
          <CardHeader><CardTitle>Основная информация</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Input name="title" placeholder="Название" required />
            <Textarea name="description" placeholder="Описание" />
            <div className="grid grid-cols-2 gap-4">
              <Input name="category" placeholder="Категория" />
              <Select name="level">
                <SelectTrigger><SelectValue placeholder="Уровень" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">beginner</SelectItem>
                  <SelectItem value="intermediate">intermediate</SelectItem>
                  <SelectItem value="advanced">advanced</SelectItem>
                </SelectContent>
              </Select>
              <Input name="durationMin" type="number" placeholder="Длительность (мин)" />
              <Input name="coverUrl" placeholder="URL обложки" />
              <Select name="visibility">
                <SelectTrigger><SelectValue placeholder="Доступ" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Все сотрудники</SelectItem>
                  <SelectItem value='["EMPLOYEE"]'>Только EMPLOYEE</SelectItem>
                  <SelectItem value='["MANAGER"]'>Только MANAGER</SelectItem>
                  <SelectItem value='["OWNER"]'>Только OWNER</SelectItem>
                </SelectContent>
              </Select>
              <Input name="dueDate" type="date" placeholder="Срок прохождения" />
              <Select name="defaultQuestionMode">
                <SelectTrigger><SelectValue placeholder="Тип вопросов по умолчанию" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="CHOICE">Выбор из вариантов</SelectItem>
                  <SelectItem value="INPUT">Ввод текста</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="md:col-span-2 space-y-4">
        <Card>
          <CardHeader><CardTitle>Действия</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Button type="submit">Сохранить черновик</Button>
            <Button type="submit" variant="outline" name="isPublished" value="true">Опубликовать</Button>
          </CardContent>
        </Card>
      </div>
    </form>
  );
}

