import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Users,
  Heart,
  DollarSign,
  Building2,
  FileText,
  Calendar,
  UserCheck,
  Shield,
  Home,
  Settings,
  ChevronDown,
  Truck,
  HandHeart,
  Banknote,
  AlertCircle,
  Cake,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface NavigationSubItem {
  title: string;
  url: string;
}

interface NavigationItem {
  title: string;
  url: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  subItems?: NavigationSubItem[];
}

const navigationItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: Home,
  },
  {
    title: "Funcionários",
    url: "/funcionarios",
    icon: Users,
    subItems: [
      { title: "Lista de Funcionários", url: "/funcionarios" },
      { title: "Cadastrar Funcionário", url: "/funcionarios/novo" },
      { title: "Aniversariantes", url: "/funcionarios/aniversariantes" },
      { title: "Departamentos", url: "/funcionarios/departamentos" },
      { title: "Advertências", url: "/funcionarios/advertencias" },
    ],
  },
  {
    title: "Idosos",
    url: "/idosos",
    icon: Heart,
    subItems: [
      { title: "Lista de Idosos", url: "/idosos" },
      { title: "Cadastrar Idoso", url: "/idosos/novo" },
      { title: "Lista de Espera", url: "/idosos/lista-espera" },
      { title: "Quartos/Alas", url: "/idosos/quartos" },
      { title: "Médico", url: "/idosos/medico" },
      { title: "Prontuário Médico", url: "/idosos/prontuario-medico" },
      { title: "Evolução Nutricional", url: "/idosos/prontuario-nutricional" },
      { title: "Avaliação Fisioterapêutica", url: "/idosos/prontuario-fisioterapeutico" },
    ],
  },
  {
    title: "Financeiro",
    url: "/financeiro",
    icon: DollarSign,
    subItems: [
      { title: "Visão Geral", url: "/financeiro" },
      { title: "Movimento de Caixa", url: "/financeiro/movimento-caixa" },
      { title: "Contas a Pagar", url: "/financeiro/contas-pagar" },
      { title: "Contas a Receber", url: "/financeiro/contas-receber" },
      { title: "Receitas Futuras", url: "/financeiro/receitas-futuras" },
      { title: "Contas Bancárias", url: "/financeiro/contas-bancarias" },
      { title: "Conciliação Bancária", url: "/financeiro/conciliacao" },
    ],
  },
  {
    title: "Fornecedores",
    url: "/fornecedores",
    icon: Truck,
    subItems: [
      { title: "Lista de Fornecedores", url: "/fornecedores" },
      { title: "Cadastrar Fornecedor", url: "/fornecedores/novo" },
      { title: "Notas Fiscais", url: "/fornecedores/notas" },
    ],
  },
  {
    title: "Doações",
    url: "/doacoes",
    icon: HandHeart,
    subItems: [
      { title: "Doações em Dinheiro", url: "/doacoes/dinheiro" },
      { title: "Doações de Itens", url: "/doacoes/itens" },
      { title: "Recibos", url: "/doacoes/recibos" },
      { title: "Relatórios", url: "/doacoes/relatorios" },
    ],
  },
  {
    title: "Obrigações",
    url: "/obrigacoes",
    icon: FileText,
    subItems: [
      { title: "Inventário de Ativos", url: "/obrigacoes/ativos" },
      { title: "Licenças de Funcionamento", url: "/obrigacoes/licencas" },
      { title: "DAS Mensal", url: "/obrigacoes/das" },
      { title: "Portal do MEI", url: "/obrigacoes/mei" },
      { title: "Consulta CNPJ", url: "/obrigacoes/cnpj" },
    ],
  },
  {
    title: "Agenda",
    url: "/agenda",
    icon: Calendar,
  },
  {
    title: "Lembretes",
    url: "/lembretes",
    icon: AlertCircle,
  },
];

const adminItems = [
  {
    title: "Usuários",
    url: "/admin/usuarios",
    icon: UserCheck,
  },
  {
    title: "Logs & Auditoria",
    url: "/admin/logs",
    icon: Shield,
  },
  {
    title: "Configurações",
    url: "/admin/configuracoes",
    icon: Settings,
  },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const [openGroups, setOpenGroups] = useState<string[]>([]);
  const collapsed = state === "collapsed";

  const isActive = (path: string) => currentPath === path;
  const isGroupActive = (item: NavigationItem) => 
    item.subItems?.some((sub: NavigationSubItem) => currentPath === sub.url) || currentPath === item.url;

  const toggleGroup = (itemTitle: string) => {
    setOpenGroups(prev => 
      prev.includes(itemTitle) 
        ? prev.filter(title => title !== itemTitle)
        : [...prev, itemTitle]
    );
  };

  const getNavClassName = (active: boolean) =>
    active 
      ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" 
      : "hover:bg-sidebar-accent/50 text-sidebar-foreground";

  return (
    <Sidebar className={collapsed ? "w-14" : "w-72"}>
      <SidebarContent className="bg-sidebar">
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/70 text-xs font-semibold uppercase tracking-wide">
            {!collapsed && "Navegação Principal"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  {item.subItems ? (
                    <Collapsible
                      open={openGroups.includes(item.title) || isGroupActive(item)}
                      onOpenChange={() => toggleGroup(item.title)}
                    >
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton 
                          className={getNavClassName(isGroupActive(item))}
                          tooltip={collapsed ? item.title : ""}
                        >
                          <item.icon className="h-4 w-4 shrink-0" />
                          {!collapsed && (
                            <>
                              <span className="flex-1">{item.title}</span>
                              <ChevronDown className="h-4 w-4 transition-transform duration-200" />
                            </>
                          )}
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      {!collapsed && (
                        <CollapsibleContent>
                          <SidebarMenuSub>
                            {item.subItems.map((subItem) => (
                              <SidebarMenuSubItem key={subItem.url}>
                                <SidebarMenuSubButton 
                                  asChild
                                  className={getNavClassName(isActive(subItem.url))}
                                >
                                  <NavLink to={subItem.url}>
                                    <span>{subItem.title}</span>
                                  </NavLink>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            ))}
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      )}
                    </Collapsible>
                  ) : (
                    <SidebarMenuButton 
                      asChild 
                      className={getNavClassName(isActive(item.url))}
                      tooltip={collapsed ? item.title : ""}
                    >
                      <NavLink to={item.url}>
                        <item.icon className="h-4 w-4 shrink-0" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/70 text-xs font-semibold uppercase tracking-wide">
            {!collapsed && "Administração"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {adminItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    className={getNavClassName(isActive(item.url))}
                    tooltip={collapsed ? item.title : ""}
                  >
                    <NavLink to={item.url}>
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
