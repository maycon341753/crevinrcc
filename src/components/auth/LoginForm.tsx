import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Eye, EyeOff, Lock, Mail, Shield } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";

const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
});

const devLoginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Senha é obrigatória"),
});

type LoginForm = z.infer<typeof loginSchema>;
type DevLoginForm = z.infer<typeof devLoginSchema>;

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [showDevPassword, setShowDevPassword] = useState(false);
  const [isDeveloperMode, setIsDeveloperMode] = useState(false);
  const { signIn, loading } = useAuth();

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const devForm = useForm<DevLoginForm>({
    resolver: zodResolver(devLoginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: LoginForm) => {
    try {
      await signIn(values.email, values.password);
    } catch (error) {
      // Error is handled in the hook
    }
  };

  const onDevSubmit = async (values: DevLoginForm) => {
    try {
      await signIn(values.email, values.password);
    } catch (error) {
      // Error is handled in the hook
    }
  };

  return (
    <Card className="w-full max-w-md crevin-card">
      <CardHeader className="space-y-2 text-center">
        <Link
          to="/institucional"
          className="relative mx-auto mb-4 block h-20 w-20 overflow-hidden rounded-lg bg-gradient-primary"
          aria-label="Ir para a página institucional"
        >
          <img src="/logocrevin.ico" alt="CREVIN" className="absolute inset-0 h-full w-full object-contain p-0" />
        </Link>
        <CardTitle className="text-2xl font-bold text-primary">
          Sistema Gestão CREVIN
        </CardTitle>
        <CardDescription>
          {isDeveloperMode 
            ? "Acesso de Desenvolvedor - Sistema Restrito" 
            : "Faça login para acessar o sistema administrativo"
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isDeveloperMode ? (
          <div className="space-y-4">
            <div className="text-center p-4 bg-muted rounded-lg">
              <Shield className="mx-auto h-8 w-8 text-primary mb-2" />
              <p className="text-sm text-muted-foreground mb-4">
                Modo Desenvolvedor Ativado
              </p>
              
              <Form {...devForm}>
                <form onSubmit={devForm.handleSubmit(onDevSubmit)} className="space-y-4">
                  <FormField
                    control={devForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-left">Email do Desenvolvedor</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                              placeholder="dev@crevin.com.br"
                              className="pl-9"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={devForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-left">Senha do Desenvolvedor</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                              type={showDevPassword ? "text" : "password"}
                              placeholder="••••••••"
                              className="pl-9 pr-9"
                              {...field}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                              onClick={() => setShowDevPassword(!showDevPassword)}
                            >
                              {showDevPassword ? (
                                <EyeOff className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <Eye className="h-4 w-4 text-muted-foreground" />
                              )}
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    className="w-full bg-gradient-primary hover:bg-primary-hover crevin-transition"
                    disabled={loading}
                  >
                    {loading ? "Entrando..." : "Entrar como Desenvolvedor"}
                  </Button>
                </form>
              </Form>
            </div>
            <Button
              variant="outline"
              onClick={() => setIsDeveloperMode(false)}
              className="w-full"
            >
              Voltar ao Login Normal
            </Button>
          </div>
        ) : (
          <>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="seu@email.com"
                            className="pl-9"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Senha</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            className="pl-9 pr-9"
                            {...field}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <Eye className="h-4 w-4 text-muted-foreground" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  className="w-full bg-gradient-primary hover:bg-primary-hover crevin-transition"
                  disabled={loading}
                >
                  {loading ? "Entrando..." : "Entrar"}
                </Button>
              </form>
            </Form>
            
            <div className="mt-6 pt-4 border-t">
              <Button
                variant="ghost"
                onClick={() => setIsDeveloperMode(true)}
                className="w-full text-xs text-muted-foreground hover:text-primary"
              >
                <Shield className="mr-2 h-3 w-3" />
                Acesso de Desenvolvedor
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
