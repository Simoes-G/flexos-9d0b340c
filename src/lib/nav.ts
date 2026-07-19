import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Users,
  UsersRound,
  Building2,
  ShieldCheck,
  Settings,
  Bell,
  FolderKanban,
  ScrollText,
  Plug,
  ShoppingCart,
  Wallet,
  Boxes,
  Factory,
  Wrench,
  BriefcaseBusiness,
  CalendarDays,
  BarChart3,
  User,
  Files,
} from "lucide-react";

export type NavItem = {
  to: string;
  label: string;
  icon: LucideIcon;
  soon?: boolean;
};

export type NavSection = {
  label: string;
  items: NavItem[];
};

export const NAV: NavSection[] = [
  {
    label: "Visão Geral",
    items: [
      { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { to: "/agenda", label: "Agenda", icon: CalendarDays },
      { to: "/relatorios", label: "Relatórios", icon: BarChart3, soon: true },
    ],
  },
  {
    label: "Operação",
    items: [
      { to: "/comercial", label: "Comercial", icon: ShoppingCart, soon: true },
      { to: "/financeiro", label: "Financeiro", icon: Wallet, soon: true },
      { to: "/estoque", label: "Estoque", icon: Boxes },

      { to: "/producao", label: "Produção", icon: Factory, soon: true },
      { to: "/servicos", label: "Serviços", icon: Wrench, soon: true },
      { to: "/projetos", label: "Projetos", icon: BriefcaseBusiness, soon: true },
    ],
  },
  {
    label: "Administração",
    items: [
      { to: "/company", label: "Empresa", icon: Building2 },
      { to: "/users", label: "Usuários", icon: Users },
      { to: "/teams", label: "Equipes", icon: UsersRound },
      { to: "/permissions", label: "Permissões", icon: ShieldCheck },
      { to: "/integrations", label: "Integrações", icon: Plug },
      { to: "/notifications", label: "Notificações", icon: Bell },
      { to: "/files", label: "Arquivos", icon: Files },
      { to: "/audit", label: "Auditoria", icon: ScrollText },
      { to: "/settings", label: "Configurações", icon: Settings },
    ],
  },
];

export const PROFILE_ITEM: NavItem = { to: "/profile", label: "Meu Perfil", icon: User };

export const MODULE_META: Record<string, { title: string; description: string; icon: LucideIcon }> =
  {
    comercial: {
      title: "Comercial",
      description:
        "Gestão de leads, oportunidades, propostas e ciclo de vendas. Área preparada para integração com CRM e pipelines personalizados.",
      icon: ShoppingCart,
    },
    financeiro: {
      title: "Financeiro",
      description:
        "Contas a pagar e receber, fluxo de caixa, DRE, conciliação bancária e integração com meios de pagamento.",
      icon: Wallet,
    },
    estoque: {
      title: "Estoque",
      description:
        "Controle de produtos, movimentações, inventário e integração com compras e vendas.",
      icon: Boxes,
    },
    producao: {
      title: "Produção",
      description:
        "Ordens de produção, apontamentos, planejamento e controle de fábrica (MRP/PCP).",
      icon: Factory,
    },
    servicos: {
      title: "Serviços",
      description: "Ordens de serviço, agenda de técnicos, SLA e histórico por cliente.",
      icon: Wrench,
    },
    projetos: {
      title: "Projetos",
      description:
        "Quadros, tarefas, cronograma, apontamento de horas e acompanhamento de entregas.",
      icon: BriefcaseBusiness,
    },
    agenda: {
      title: "Agenda",
      description:
        "Compromissos, reuniões e eventos da empresa, com integração de calendários.",
      icon: CalendarDays,
    },
    relatorios: {
      title: "Relatórios",
      description:
        "Dashboards e relatórios avançados por módulo, exportação e análises personalizadas.",
      icon: BarChart3,
    },
  };
