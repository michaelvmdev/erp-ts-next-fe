/**
 * Tipos del contrato de la API (crud-ts-nest-be).
 *
 * Reflejan uno a uno los DTOs del backend. Se mantienen a mano (y no generados)
 * para que queden legibles; si el backend cambia un contrato, este archivo es el
 * unico punto a tocar en el front.
 */

// --- Comunes -----------------------------------------------------------------

export type SortDirection = 'ASC' | 'DESC';

/** Metadatos de paginado, identicos en todos los listados. */
export interface PageMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/** Envoltorio de una pagina de resultados. */
export interface Paginated<T> {
  items: T[];
  meta: PageMeta;
}

/** Cuerpo unico de error que devuelve la API ante cualquier fallo. */
export interface ApiErrorBody {
  statusCode: number;
  /** Identificador estable del error; es la clave sobre la que ramificar. */
  code: string;
  /** Texto (error de dominio) o lista (varios campos invalidos). */
  message: string | string[];
  path: string;
  method: string;
  timestamp: string;
  /** Solo presente en errores 500. */
  incidentId?: string;
}

// --- Marcas ------------------------------------------------------------------

export interface Brand {
  brandId: string;
  brandDescription: string;
  brandActive: boolean;
}

export interface CreateBrandRequest {
  brandDescription: string;
  brandActive?: boolean;
}

export interface UpdateBrandRequest {
  brandDescription?: string;
  brandActive?: boolean;
}

export interface ListBrandsQuery {
  /** Coincidencia parcial, insensible a mayusculas. */
  brandDescription?: string;
  brandActive?: boolean;
  sortDirection?: SortDirection;
  page?: number;
  limit?: number;
}

// --- Clientes ----------------------------------------------------------------

export interface Client {
  clientId: string;
  clientDescription: string;
  documentTypeId: number;
  documentNumber: string;
  clientActive: boolean;
}

export interface CreateClientRequest {
  clientDescription: string;
  documentTypeId: number;
  /** Solo digitos: 8 (DNI) u 11 (RUC). */
  documentNumber: string;
  clientActive?: boolean;
}

export interface UpdateClientRequest {
  clientDescription?: string;
  documentTypeId?: number;
  documentNumber?: string;
  clientActive?: boolean;
}

export interface ListClientsQuery {
  clientDescription?: string;
  /** Busqueda exacta por documento. */
  documentNumber?: string;
  documentTypeId?: number;
  clientActive?: boolean;
  sortBy?: 'description' | 'documentNumber';
  sortDirection?: SortDirection;
  page?: number;
  limit?: number;
}

// --- Productos ---------------------------------------------------------------

export interface Product {
  productId: string;
  brandId: string;
  categoryId: string;
  productName: string;
  productDescription: string | null;
  productImage: string | null;
  productUnitPrice: number;
  productActive: boolean;
}

export interface CreateProductRequest {
  brandId: string;
  categoryId: string;
  productName: string;
  productDescription?: string | null;
  productImage?: string | null;
  productUnitPrice: number;
  productActive?: boolean;
}

export interface UpdateProductRequest {
  brandId?: string;
  categoryId?: string;
  productName?: string;
  /** `null` borra la descripcion; omitir la deja intacta. */
  productDescription?: string | null;
  /** `null` quita la imagen; omitir la deja intacta. */
  productImage?: string | null;
  productUnitPrice?: number;
  productActive?: boolean;
}

export interface PriceRange {
  min?: number;
  max?: number;
}

/** Cuerpo de POST /products/query (la busqueda viaja en el body, no en la URL). */
export interface QueryProductsRequest {
  productDescription?: string;
  productUnitPrice?: PriceRange;
  brandId?: string;
  productActive?: boolean;
  sortBy?: 'name' | 'unitPrice';
  sortDirection?: SortDirection;
  page?: number;
  limit?: number;
}

// --- Ventas ------------------------------------------------------------------

export interface SaleLine {
  item: number;
  productId: string;
  quantity: number;
  /** Precio congelado al momento de la venta. */
  unitPrice: number;
  partial: number;
}

export interface Sale {
  saleId: string;
  saleNumber: string;
  saleTypeCode: string;
  saleDate: string;
  saleHour: string;
  clientId: string;
  departmentId: string;
  provinceId: string;
  districtId: string;
  subTotal: number;
  igv: number;
  total: number;
  saleDetails: SaleLine[];
}

/** Cabecera del listado: sin lineas, con `lineCount`. */
export interface SaleSummary {
  saleId: string;
  saleNumber: string;
  saleTypeCode: string;
  saleDate: string;
  saleHour: string;
  clientId: string;
  departmentId: string;
  provinceId: string;
  districtId: string;
  subTotal: number;
  igv: number;
  total: number;
  lineCount: number;
}

export interface SaleLineRequest {
  productId: string;
  quantity: number;
}

/** No se envian importes ni numero: los calcula/asigna el backend. */
export interface CreateSaleRequest {
  saleTypeId: number;
  clientId: string;
  /** Codigo de distrito, 6 digitos. */
  districtId: string;
  saleDate?: string;
  saleHour?: string;
  saleDetails: SaleLineRequest[];
}

export interface UpdateSaleRequest {
  clientId?: string;
  districtId?: string;
  /** Si viene, reemplaza por completo las lineas y recalcula importes. */
  saleDetails?: SaleLineRequest[];
}

/** Comprobante en PDF codificado en base64 (generado en memoria por el backend). */
export interface SalePdf {
  fileName: string;
  mimeType: string;
  base64: string;
}

/** Resultado de enviar el comprobante por correo. */
export interface SaleEmailResult {
  to: string;
  messageId: string;
  sentAt: string;
}

export interface SearchSalesQuery {
  saleNumber?: string;
  saleTypeCode?: string;
  clientId?: string;
  districtId?: string;
  departmentId?: string;
  dateFrom?: string;
  dateTo?: string;
  totalMin?: number;
  totalMax?: number;
  sortBy?: 'date' | 'number' | 'total';
  sortDirection?: SortDirection;
  page?: number;
  limit?: number;
}

// --- Catalogos ---------------------------------------------------------------

export interface DocumentType {
  documentTypeId: number;
  documentTypeDescription: string;
}

export interface SaleType {
  saleTypeId: number;
  saleTypeDescription: string;
  /** Prefijo del numero de comprobante (p. ej. "FAC"). */
  saleTypeCode: string;
}

// --- Ubigeo ------------------------------------------------------------------

export interface Department {
  departmentId: string;
  departmentDescription: string;
}

export interface Province {
  provinceId: string;
  departmentId: string;
  provinceDescription: string;
}

export interface District {
  districtId: string;
  provinceId: string;
  districtDescription: string;
}

// --- Categorias --------------------------------------------------------------

export interface Category {
  categoryId: string;
  categoryDescription: string;
  categoryActive: boolean;
}

export interface CreateCategoryRequest {
  categoryDescription: string;
  categoryActive?: boolean;
}

export interface UpdateCategoryRequest {
  categoryDescription?: string;
  categoryActive?: boolean;
}

export interface ListCategoriesQuery {
  categoryDescription?: string;
  categoryActive?: boolean;
  sortDirection?: SortDirection;
  page?: number;
  limit?: number;
}

// --- Compras -----------------------------------------------------------------

export interface PurchaseLine {
  item: number;
  productId: string;
  quantity: number;
  unitPrice: number;
  partial: number;
}

export interface Purchase {
  purchaseId: string;
  supplierId: string;
  purchaseDate: string;
  purchaseHour: string;
  subTotal: number;
  igv: number;
  total: number;
  purchaseDetails: PurchaseLine[];
}

export interface PurchaseSummary {
  purchaseId: string;
  supplierId: string;
  purchaseDate: string;
  purchaseHour: string;
  subTotal: number;
  igv: number;
  total: number;
  lineCount: number;
}

export interface PurchaseLineRequest {
  productId: string;
  quantity: number;
  unitPrice: number;
}

export interface CreatePurchaseRequest {
  supplierId: string;
  purchaseDate?: string;
  purchaseHour?: string;
  purchaseDetails: PurchaseLineRequest[];
}

export interface UpdatePurchaseRequest {
  supplierId?: string;
  purchaseDate?: string;
  purchaseHour?: string;
  purchaseDetails?: PurchaseLineRequest[];
}

export interface SearchPurchasesQuery {
  supplierId?: string;
  dateFrom?: string;
  dateTo?: string;
  totalMin?: number;
  totalMax?: number;
  sortBy?: 'date' | 'total';
  sortDirection?: SortDirection;
  page?: number;
  limit?: number;
}

// --- Proveedores -------------------------------------------------------------

export interface Supplier {
  supplierId: string;
  supplierDescription: string;
  supplierRuc: string;
  supplierActive: boolean;
}

export interface CreateSupplierRequest {
  supplierDescription: string;
  supplierRuc: string;
  supplierActive?: boolean;
}

export interface UpdateSupplierRequest {
  supplierDescription?: string;
  supplierRuc?: string;
  supplierActive?: boolean;
}

export interface ListSuppliersQuery {
  supplierDescription?: string;
  supplierRuc?: string;
  supplierActive?: boolean;
  sortDirection?: SortDirection;
  page?: number;
  limit?: number;
}

// --- Diagramas anuales (dashboard) -------------------------------------------

/** Un punto de importe por año; devuelto por /dashboard/yearly-sales. */
export interface YearlySalesPoint {
  year: number;
  /** Importe total como cadena decimal, ej. "184250.00". */
  total: string;
}

export interface YearlySalesResponse {
  items: YearlySalesPoint[];
}

/** Un punto mensual de importe. `total` es una cadena decimal ("48250.00"). */
export interface MonthlySalesPoint {
  month: number;
  total: string;
}

/** Serie anual de 12 meses; usada por ventas mensuales, por ubigeo y por categoria. */
export interface MonthlySalesSeries {
  year: number;
  items: MonthlySalesPoint[];
}

/** Producto lider de un mes; los campos van en `null` si el mes no tuvo ventas. */
export interface MonthlyTopProductPoint {
  month: number;
  productId: string | null;
  productName: string | null;
  productDescription: string | null;
  unitsSold: number;
}

export interface TopProductByMonthSeries {
  year: number;
  items: MonthlyTopProductPoint[];
}

export interface MonthlySalesByUbigeoParams {
  year: number;
  /** Obligatorio: codigo de departamento (2 digitos). */
  departmentId: string;
  provinceId?: string;
  districtId?: string;
}

// --- Unidades de medida ------------------------------------------------------

export interface Unit {
  unitId: string;
  unitCode: string;
  unitDescription: string;
  unitActive: boolean;
}

export interface CreateUnitRequest {
  unitCode: string;
  unitDescription: string;
  unitActive?: boolean;
}

export interface UpdateUnitRequest {
  unitCode?: string;
  unitDescription?: string;
  unitActive?: boolean;
}

export interface ListUnitsQuery {
  unitCode?: string;
  unitDescription?: string;
  unitActive?: boolean;
  sortDirection?: SortDirection;
  page?: number;
  limit?: number;
}

// --- Salud -------------------------------------------------------------------

export interface HealthStatus {
  status: string;
  latencyMs: number;
}
