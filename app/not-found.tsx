import Link from "next/link";
import { FileQuestion, Home } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function NotFound() {
  return (
    <div className="min-h-dvh flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-amber-500/10 flex items-center justify-center">
            <FileQuestion className="h-8 w-8 text-amber-400" />
          </div>
          <CardTitle className="text-xl">404 - Página não encontrada</CardTitle>
          <CardDescription>
            A página que você está procurando não existe ou foi movida.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild className="w-full">
            <Link href="/dashboard">
              <Home className="h-4 w-4 mr-2" />
              Voltar ao Dashboard
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
