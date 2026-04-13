import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MapPin, MessageCircle, Phone, ShieldCheck, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

const Index = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signIn, loading, user } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const address = "St. Tradicional Q 63 lt 12 - Planaltina, Brasília - DF, 73330-630";
  const phoneDisplay = "(61) 3389-9448";
  const phoneDigits = "6133899448";
  const whatsappPhone = "556133899448";

  const mapsUrl = useMemo(() => {
    const q = encodeURIComponent(address);
    return `https://www.google.com/maps/search/?api=1&query=${q}`;
  }, [address]);

  const whatsappUrl = useMemo(() => {
    const text = encodeURIComponent("Olá! Gostaria de saber mais sobre o Lar dos Idosos CREVIN.");
    return `https://wa.me/${whatsappPhone}?text=${text}`;
  }, [whatsappPhone]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    const emailTrimmed = email.trim();
    if (!emailTrimmed || !password.trim()) {
      toast({
        variant: "destructive",
        title: "Dados incompletos",
        description: "Informe usuário e senha para entrar.",
      });
      return;
    }

    const looksLikeEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed);
    if (!looksLikeEmail) {
      toast({
        variant: "destructive",
        title: "Usuário inválido",
        description: "Use seu email cadastrado como usuário.",
      });
      return;
    }

    try {
      await signIn(emailTrimmed, password);
      navigate("/", { replace: true });
    } catch {
      return;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur">
        <div className="container flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo_rccdf_site.png" alt="logo_rccdf_site" className="h-10 w-auto" />
            <div className="leading-tight">
              <div className="text-lg font-semibold tracking-tight text-secondary">CREVIN</div>
              <div className="text-xs text-muted-foreground">Lar dos Idosos</div>
            </div>
          </div>

          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:justify-end">
            {user ? (
              <Button onClick={() => navigate("/")}>Acessar sistema</Button>
            ) : (
              <form onSubmit={handleLogin} className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
                <label className="sr-only" htmlFor="header-user">
                  Usuário
                </label>
                <Input
                  id="header-user"
                  placeholder="Usuário (email)"
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full sm:w-56"
                />
                <label className="sr-only" htmlFor="header-password">
                  Senha
                </label>
                <Input
                  id="header-password"
                  type="password"
                  placeholder="Senha"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full sm:w-44"
                />
                <Button type="submit" variant="secondary" disabled={loading} className="w-full sm:w-auto">
                  Entrar
                </Button>
              </form>
            )}
          </div>
        </div>
      </header>

      <main>
        <section className="bg-gradient-to-br from-secondary/15 via-background to-background">
          <div className="container py-12 sm:py-16">
            <div className="grid items-center gap-8 lg:grid-cols-2">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-sm text-muted-foreground shadow-sm">
                  <img src="/logocrevin.ico" alt="logocrevin" className="h-4 w-4" />
                  <span>Instituição filantrópica</span>
                </div>
                <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
                  Lar dos Idosos CREVIN
                </h1>
                <p className="text-lg text-muted-foreground">Cuidando com amor e dignidade</p>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button asChild variant="secondary" className="shadow-md">
                    <a href="#doacoes">Faça sua colaboração</a>
                  </Button>
                  <Button asChild variant="outline">
                    <a href={mapsUrl} target="_blank" rel="noreferrer">
                      <MapPin />
                      Localização no Maps
                    </a>
                  </Button>
                </div>
              </div>

              <Card className="crevin-card">
                <CardHeader className="space-y-0">
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <ShieldCheck className="text-secondary" />
                    Transparência e cuidado
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm text-muted-foreground">
                  <p>
                    A CREVIN (Comunidade de Renovação Esperança e Vida Nova) é uma iniciativa da Renovação Carismática
                    Católica de Brasília, destinada a abrigar idosos carentes com o apoio da Paróquia São Sebastião de
                    Planaltina.
                  </p>
                  <p>
                    Inaugurada em novembro de 2000, abriga mais de 30 idosos, entre homens e mulheres com diferentes
                    necessidades. É a única instituição católica do Distrito Federal ligada à Arquidiocese voltada ao
                    acolhimento da terceira idade.
                  </p>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <Button asChild variant="link" className="h-auto p-0 text-secondary">
                      <a href="#sobre">Conheça a instituição</a>
                    </Button>
                    <span className="hidden sm:inline text-muted-foreground/60">•</span>
                    <Button asChild variant="link" className="h-auto p-0 text-secondary">
                      <a href="#contato">Fale conosco</a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section id="sobre" className="container py-10 sm:py-14">
          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="crevin-card lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <img src="/logocrevin.ico" alt="logocrevin" className="h-5 w-5" />
                  Sobre a CREVIN
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-muted-foreground">
                <p>
                  Atuamos no acolhimento e no cuidado diário de idosos, oferecendo um ambiente seguro, respeitoso e
                  acolhedor, com foco na dignidade e na qualidade de vida.
                </p>
                <p>
                  Nosso trabalho conta com apoio comunitário e parcerias locais, garantindo que cada residente receba
                  atenção adequada, carinho e acompanhamento conforme suas necessidades.
                </p>
              </CardContent>
            </Card>

            <Card className="crevin-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <img src="/logocrevin.ico" alt="logocrevin" className="h-5 w-5" />
                  Informações
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-start justify-between gap-3">
                  <span className="text-muted-foreground">Nome</span>
                  <span className="text-right font-medium">CREVIN Lar dos Idosos</span>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <span className="text-muted-foreground">Avaliação</span>
                  <span className="inline-flex items-center gap-1 text-right font-medium">
                    <Star className="text-secondary" />
                    4,7 (107 avaliações)
                  </span>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <span className="text-muted-foreground">Tipo</span>
                  <span className="text-right font-medium">Associação / organização</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="container pb-10 sm:pb-14">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="crevin-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <img src="/logocrevin.ico" alt="logocrevin" className="h-5 w-5" />
                  Endereço
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-muted-foreground">{address}</p>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button asChild variant="outline" className="justify-start">
                    <a href={mapsUrl} target="_blank" rel="noreferrer">
                      <MapPin />
                      Abrir no Google Maps
                    </a>
                  </Button>
                  <Button asChild variant="secondary" className="justify-start">
                    <a href={`tel:+55${phoneDigits}`}>
                      <Phone />
                      Ligar agora
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="crevin-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <img src="/logocrevin.ico" alt="logocrevin" className="h-5 w-5" />
                  Agendamento
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-muted-foreground">Marque uma visita: {phoneDisplay}</p>
                <Button asChild variant="outline" className="justify-start">
                  <a href={whatsappUrl} target="_blank" rel="noreferrer">
                    <MessageCircle />
                    Falar no WhatsApp
                  </a>
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>

        <section id="doacoes" className="border-y bg-secondary/5">
          <div className="container py-10 sm:py-14">
            <div className="grid gap-6 lg:grid-cols-3">
              <Card className="crevin-card border-secondary/20 shadow-secondary lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-secondary">
                    <img src="/logocrevin.ico" alt="logocrevin" className="h-5 w-5" />
                    Faça sua colaboração
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-lg border bg-background p-4 shadow-sm">
                    <div className="text-sm font-semibold">Banco do Brasil</div>
                    <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                      <div>Agência: 3264-6</div>
                      <div>Conta Corrente: 60020-2</div>
                    </div>
                  </div>
                  <div className="rounded-lg border bg-background p-4 shadow-sm">
                    <div className="text-sm font-semibold">BRB</div>
                    <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                      <div>Agência: 110</div>
                      <div>Conta Corrente: 604900-1</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="crevin-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <img src="/logocrevin.ico" alt="logocrevin" className="h-5 w-5" />
                    Próximos passos
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                  <p>Estrutura preparada para futuras expansões: painel institucional, fotos e áreas informativas.</p>
                  <div className="flex flex-col gap-2">
                    <Button asChild variant="outline" className="justify-start">
                      <Link to="/auth">Entrar no sistema</Link>
                    </Button>
                    <Button asChild variant="secondary" className="justify-start">
                      <a href={mapsUrl} target="_blank" rel="noreferrer">
                        <MapPin />
                        Como chegar
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section id="contato" className="container py-10 sm:py-14">
          <Card className="crevin-card">
            <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <div className="text-lg font-semibold">CREVIN - Lar dos Idosos</div>
                <div className="text-sm text-muted-foreground">Telefone: {phoneDisplay}</div>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <Button asChild variant="secondary">
                  <a href={`tel:+55${phoneDigits}`}>
                    <Phone />
                    Ligar
                  </a>
                </Button>
                <Button asChild variant="outline">
                  <a href={whatsappUrl} target="_blank" rel="noreferrer">
                    <MessageCircle />
                    WhatsApp
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>

      <a
        href={whatsappUrl}
        target="_blank"
        rel="noreferrer"
        className="fixed bottom-5 right-5 z-50 inline-flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-secondary-foreground shadow-lg transition-colors hover:bg-secondary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        aria-label="Falar no WhatsApp"
      >
        <MessageCircle className="h-5 w-5" />
      </a>
    </div>
  );
};

export default Index;
