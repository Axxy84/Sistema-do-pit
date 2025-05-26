import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value) {
  if (typeof value !== 'number') {
    const parsedValue = parseFloat(value);
    if (isNaN(parsedValue)) {
      return 'R$ 0,00';
    }
    value = parsedValue;
  }
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function formatDate(dateString) {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    // Adicionar verificação se a data é válida
    if (isNaN(date.getTime())) {
      // Tentar parse com formato ISO se tiver Z ou timezone offset
      if (dateString.includes('T') && (dateString.includes('Z') || dateString.match(/[+-]\d{2}:\d{2}$/))) {
        const isoDate = new Date(dateString.replace(/(\.\d{3})?Z$/, '').replace(/([+-])(\d{2}):(\d{2})$/, '$1$2$3'));
        if (!isNaN(isoDate.getTime())) {
          return isoDate.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          });
        }
      }
      console.warn('Data inválida recebida em formatDate:', dateString);
      return 'Data inválida'; // Ou retornar a string original, ou uma string vazia
    }
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch (error) {
    console.error('Erro ao formatar data:', dateString, error);
    return 'Data inválida'; // Ou retornar a string original
  }
}