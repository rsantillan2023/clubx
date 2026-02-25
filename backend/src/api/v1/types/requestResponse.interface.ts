export interface IRequestReponse {
  data?: any[] | any;
  status?: string;
  message?: string;
  pageCount?: number;
  totalPages?: number;
  currentPage?: number | null;
  nextPage?: number | null;
  previousPage?: number | null;
  totalCount?: number;
}
