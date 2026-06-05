import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Função para formatar CPF
export const formatCPF = (value: string) => {
  const numbers = value.replace(/\D/g, '');
  
  if (numbers.length <= 3) {
    return numbers;
  }
  if (numbers.length <= 6) {
    return numbers.replace(/(\d{3})(\d+)/, '$1.$2');
  }
  if (numbers.length <= 9) {
    return numbers.replace(/(\d{3})(\d{3})(\d+)/, '$1.$2.$3');
  }
  return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{0,2})/, '$1.$2.$3-$4');
};

// Função para formatar telefone
export const formatPhone = (value: string) => {
  const numbers = value.replace(/\D/g, '');
  if (numbers.length <= 10) {
    return numbers.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  }
  return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
};

// Função para formatar valor monetário brasileiro com separação automática (1.234,56)
export const formatCurrencyInput = (value: string): string => {
  // Remove tudo que não é dígito
  let numbers = value.replace(/\D/g, '');
  
  // Remove zeros à esquerda
  numbers = numbers.replace(/^0+/, '');
  
  // Se não há números, retorna string vazia
  if (!numbers) return '';
  
  // Se tem apenas 1 dígito, formata como 0,0X
  if (numbers.length === 1) {
    return `0,0${numbers}`;
  }
  
  // Se tem 2 dígitos, formata como 0,XX
  if (numbers.length === 2) {
    return `0,${numbers}`;
  }
  
  // Para 3 ou mais dígitos, separa centavos (últimos 2 dígitos)
  const centavos = numbers.slice(-2);
  const reais = numbers.slice(0, -2);
  
  // Adiciona separador de milhares na parte dos reais
  const reaisFormatted = reais.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  
  return `${reaisFormatted},${centavos}`;
};

// Função para converter valor brasileiro (com vírgula) para número
export const parseBrazilianCurrency = (value: string): number => {
  if (!value) return 0;
  
  // Remove pontos (separadores de milhares) e substitui vírgula por ponto
  const cleanValue = value.trim().replace(/\./g, '').replace(',', '.');
  const parsed = parseFloat(cleanValue);
  
  return isNaN(parsed) ? 0 : parsed;
};

// Função para formatar número para exibição brasileira com R$ (R$ 1.234,56)
export const formatBrazilianCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

// Função para formatar número para exibição brasileira sem símbolo (1.234,56)
export const formatBrazilianCurrencyValue = (value: number): string => {
  // Se o valor for 0 ou null/undefined, retorna string vazia
  if (!value || value === 0) return '';
  
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

// Função para validar formato de moeda brasileira
export const isValidBrazilianCurrency = (value: string): boolean => {
  if (!value) return true; // Campo vazio é válido
  
  // Regex para formato brasileiro: números com pontos como separadores de milhares e vírgula para decimais
  const regex = /^\d{1,3}(\.\d{3})*,\d{2}$/;
  return regex.test(value.trim());
};

// Função para formatar salário com separador de milhares (3.795,00)
export const formatSalaryInput = (value: string): string => {
  // Remove tudo que não é dígito ou vírgula
  let numbers = value.replace(/[^\d,]/g, '');
  
  // Garante que só há uma vírgula
  const parts = numbers.split(',');
  if (parts.length > 2) {
    numbers = parts[0] + ',' + parts.slice(1).join('');
  }
  
  // Limita a 2 casas decimais após a vírgula
  if (parts.length === 2 && parts[1].length > 2) {
    numbers = parts[0] + ',' + parts[1].substring(0, 2);
  }
  
  // Adiciona separador de milhares na parte inteira
  if (parts[0]) {
    const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    numbers = integerPart + (parts[1] !== undefined ? ',' + parts[1] : '');
  }
  
  return numbers;
};

// Função para converter salário brasileiro para número
export const parseBrazilianSalary = (value: string): number => {
  if (!value) return 0;
  
  // Remove pontos (separadores de milhares) e substitui vírgula por ponto
  const cleanValue = value.trim().replace(/\./g, '').replace(',', '.');
  const parsed = parseFloat(cleanValue);
  
  return isNaN(parsed) ? 0 : parsed;
};

// Função para formatar número para exibição de salário brasileiro (3.795,00)
export const formatBrazilianSalary = (value: number): string => {
  // Se o valor for 0 ou null/undefined, retorna string vazia
  if (!value || value === 0) return '';
  
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

// Função para validar formato de salário brasileiro
export const isValidBrazilianSalary = (value: string): boolean => {
  if (!value) return false;
  const regex = /^\d{1,3}(\.\d{3})*,\d{2}$/;
  return regex.test(value);
};

// Função para formatar data no padrão brasileiro DD/MM/AAAA
export const parseISOToLocalDate = (isoDate: string): Date | null => {
  if (!isoDate || !/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return null;
  const [year, month, day] = isoDate.split('-').map(Number);
  return new Date(year, month - 1, day);
};

// Função para formatar uma data local como ISO (YYYY-MM-DD)
export const formatLocalDateToISO = (date: Date): string => {
  if (!date || isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const formatBrazilianDate = (date: string | Date): string => {
  if (!date) return '';
  
  let dateObj: Date;
  
  if (typeof date === 'string') {
    // Se a data está no formato YYYY-MM-DD (sem timezone), trata como data local
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      const [year, month, day] = date.split('-').map(Number);
      dateObj = new Date(year, month - 1, day); // month - 1 porque Date usa 0-11 para meses
    } else {
      dateObj = new Date(date);
    }
  } else {
    dateObj = date;
  }
  
  // Verifica se a data é válida
  if (isNaN(dateObj.getTime())) return '';
  
  return dateObj.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

// Função para formatar data e hora no padrão brasileiro DD/MM/AAAA HH:mm
export const formatBrazilianDateTime = (date: string | Date): string => {
  if (!date) return '';
  
  let dateObj: Date;
  
  if (typeof date === 'string') {
    dateObj = new Date(date);
  } else {
    dateObj = date;
  }
  
  // Verifica se a data é válida
  if (isNaN(dateObj.getTime())) return '';
  
  const dateStr = dateObj.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
  
  const timeStr = dateObj.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit'
  });
  
  return `${dateStr} ${timeStr}`;
};

// Função para formatar apenas a hora no padrão brasileiro HH:mm:ss
export const formatBrazilianTime = (date: string | Date): string => {
  if (!date) return '';
  
  let dateObj: Date;
  
  if (typeof date === 'string') {
    dateObj = new Date(date);
  } else {
    dateObj = date;
  }
  
  // Verifica se a data é válida
  if (isNaN(dateObj.getTime())) return '';
  
  return dateObj.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

// Função para converter data do formato DD/MM/AAAA para ISO (AAAA-MM-DD)
export const parseBrazilianDate = (dateString: string): string => {
  if (!dateString) return '';
  
  // Se já está no formato ISO, retorna como está
  if (dateString.includes('-') && dateString.length === 10) {
    return dateString;
  }
  
  // Se está no formato DD/MM/AAAA, converte para ISO
  const parts = dateString.split('/');
  if (parts.length === 3) {
    const [day, month, year] = parts;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  
  return dateString;
};

// Função para calcular idade a partir de uma data de nascimento (ISO)
export const calculateAge = (birthDate: string): number => {
  if (!birthDate) return 0;
  
  const today = new Date();
  const birth = parseISOToLocalDate(birthDate);
  if (!birth) return 0;
  
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return age;
};
