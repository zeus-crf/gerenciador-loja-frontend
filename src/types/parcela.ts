export type StatusParcela = "ABERTA" | "PAGA" | "VENCIDA"

export interface Parcela {
  id: string
  numero: number
  valor: number
  dataVencimento: string
  dataPagamento?: string
  status: StatusParcela
}
