import { AuthButtons } from "@/components/AuthButtons";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
            HoReCa SaaS
          </h1>
          <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">
            Управление ресторанами, кафе и отелями
          </p>
        </div>
        
        <div className="mt-8 space-y-4">
          <AuthButtons />
          <div className="text-center">
            <Link href="/pricing">
              <Button variant="outline" className="w-full">
                Посмотреть планы
              </Button>
            </Link>
          </div>
        </div>
        
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Войдите в систему, чтобы начать работу с платформой
          </p>
        </div>
      </div>
    </div>
  );
}
