// Tipos para el módulo de cirugías

export type SurgeryStatus = 'iniciada' | 'finalizada';
export type MaterialControlMoment = 'pre' | 'trans' | 'final';

// ============================================
// CIRUGÍA PRINCIPAL
// ============================================

export interface Surgery {
  id: string;
  patientId: string;
  surgeryItemId: string;
  status: SurgeryStatus;
  completedDate?: string | Date | null;
  createdAt: string | Date;
  updatedAt: string | Date;
  // Relaciones
  patient?: {
    id: string;
    firstName: string;
    lastName: string;
    identityNumber: string;
  };
  surgeryItem?: {
    id: string;
    name: string;
    basePrice: number;
  } | null;
  // Nombre del TransactionItem (para cuando surgeryItem es null)
  transactionItemName?: string | null;
  payment?: {
    id: string;
    total: number;
    status: string;
  };
}

export interface CreateSurgeryData {
  patientId: string;
  surgeryItemId?: string; // Opcional, ya no se usa para el precio
  hospitalizationId?: string; // Si está relacionada con hospitalización
  // Campos manuales para concepto y precio (similar a items variables)
  nombre: string; // Concepto/descripción de la cirugía
  precioUnitario: number; // Precio unitario (ISV incluido)
  quantity?: number; // Cantidad (por defecto 1)
}

export interface UpdateSurgeryData {
  status?: SurgeryStatus;
  completedDate?: string;
}

// ============================================
// NOTA OPERATORIA
// ============================================

export interface OperativeNote {
  id: string;
  surgeryId: string;
  diagnosticoPreoperatorio: string;
  ayudante?: string | null;
  anestesia?: string | null;
  circulante?: string | null;
  instrumentalista?: string | null;
  sangrado?: string | null;
  complicaciones?: string | null;
  conteoMaterial?: string | null;
  hallazgos?: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface CreateOperativeNoteData {
  diagnosticoPreoperatorio: string;
  ayudante?: string;
  anestesia?: string;
  circulante?: string;
  instrumentalista?: string;
  sangrado?: string;
  complicaciones?: string;
  conteoMaterial?: string;
  hallazgos?: string;
}

// ============================================
// ÓRDENES Y ANOTACIONES MÉDICAS
// ============================================

export interface SurgeryAnnotation {
  id: string;
  surgeryMedicalOrdersId: string;
  content: string;
  createdAt: string | Date;
}

export interface SurgeryOrder {
  id: string;
  surgeryMedicalOrdersId: string;
  content: string;
  createdAt: string | Date;
}

export interface SurgeryMedicalOrders {
  id: string;
  surgeryId: string;
  createdAt: string | Date;
  updatedAt: string | Date;
  anotaciones: SurgeryAnnotation[];
  ordenes: SurgeryOrder[];
}

export interface CreateSurgeryMedicalOrdersData {
  anotaciones: string[]; // Array de contenidos
  ordenes: string[];
}

// ============================================
// REGISTRO DE ANESTESIA
// ============================================

export interface AnesthesiaGridData {
  [timeSlot: string]: {
    [parameter: string]: string | number | null;
  };
}

export interface AnesthesiaRecord {
  id: string;
  surgeryId: string;
  premedicacion?: string | null;
  estadoFisico?: string | null;
  pronosticoOperatorio?: string | null;
  agentesTecnicas?: string | null;
  resumenLiquidos?: string | null;
  tiempoDuracionAnestesia?: string | null;
  operacion?: string | null;
  cirujano?: string | null;
  complicaciones?: string | null;
  anestesiologo?: string | null;
  gridData?: string | null; // JSON string
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface CreateAnesthesiaRecordData {
  premedicacion?: string;
  estadoFisico?: string;
  pronosticoOperatorio?: string;
  agentesTecnicas?: string;
  resumenLiquidos?: string;
  tiempoDuracionAnestesia?: string;
  operacion?: string;
  cirujano?: string;
  complicaciones?: string;
  anestesiologo?: string;
  gridData?: string; // JSON string
}

// ============================================
// CONTROL DE MATERIALES E INSTRUMENTOS
// ============================================

export interface MaterialControl {
  id: string;
  surgeryId: string;
  moment: MaterialControlMoment;
  
  // Instrumentos
  tijerasMetzembaumCurvas: number;
  tijerasMetzembaumRectas: number;
  tijeraMayoCurvas: number;
  tijeraMayoRectas: number;
  mangoBisturi: number;
  hemostaticaCurvas: number;
  hemostaticaRectas: number;
  pinzaKellyCurvas: number;
  pinzaKellyRectas: number;
  pinzaKochersCurvas: number;
  pinzaKorchersRectas: number;
  pinzaMosquitoCurvas: number;
  pinzaMosquitoRectas: number;
  pinzaAllis: number;
  pinzaBabcock: number;
  pinzaCampo: number;
  pinzaDiseccionSinDientes: number;
  pinzaDiseccionConDientes: number;
  pinzaAnillo: number;
  pinzaGinecologicas: number;
  pinzaMixter: number;
  portagujas: number;
  separadores: number;
  pinzaPeam: number;
  otrosSeparadores: number;
  otrasPinzas: number;
  otros: number;
  
  // Suturas
  cromico: number;
  sedas: number;
  nylon: number;
  poliglactinaVicryl: number;
  otrasSuturas: number;
  otrosSuturas: number;
  
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface CreateMaterialControlData {
  moment: MaterialControlMoment;
  tijerasMetzembaumCurvas?: number;
  tijerasMetzembaumRectas?: number;
  tijeraMayoCurvas?: number;
  tijeraMayoRectas?: number;
  mangoBisturi?: number;
  hemostaticaCurvas?: number;
  hemostaticaRectas?: number;
  pinzaKellyCurvas?: number;
  pinzaKellyRectas?: number;
  pinzaKochersCurvas?: number;
  pinzaKorchersRectas?: number;
  pinzaMosquitoCurvas?: number;
  pinzaMosquitoRectas?: number;
  pinzaAllis?: number;
  pinzaBabcock?: number;
  pinzaCampo?: number;
  pinzaDiseccionSinDientes?: number;
  pinzaDiseccionConDientes?: number;
  pinzaAnillo?: number;
  pinzaGinecologicas?: number;
  pinzaMixter?: number;
  portagujas?: number;
  separadores?: number;
  pinzaPeam?: number;
  otrosSeparadores?: number;
  otrasPinzas?: number;
  otros?: number;
  cromico?: number;
  sedas?: number;
  nylon?: number;
  poliglactinaVicryl?: number;
  otrasSuturas?: number;
  otrosSuturas?: number;
}

// ============================================
// SOLICITUD DE QUIRÓFANO
// ============================================

export interface OperatingRoomRequest {
  id: string;
  surgeryId: string;
  diagnosticoPreoperatorio: string;
  tipoAnestesia?: string | null;
  instrumentoEspecial?: string | null;
  
  // Tiempos
  horaSolicitud?: string | Date | null;
  horaLlegadaQx?: string | Date | null;
  horaEntraQx?: string | Date | null;
  horaAnestesia?: string | Date | null;
  horaInicioQx?: string | Date | null;
  horaFinQx?: string | Date | null;
  horaSaleQx?: string | Date | null;
  horaRecibeRecuperacion?: string | Date | null;
  horaSaleRecuperacion?: string | Date | null;
  
  // Booleans y detalles
  usoSangre: boolean;
  entregaOportunaSangre: boolean;
  complicacion: boolean;
  tipoComplicacion?: string | null;
  contaminacionQuirofano: boolean;
  fumigaQuirofanoPor?: string | null;
  tiempo?: string | null;
  
  // Personal
  medicoSolicitante?: string | null;
  anestesiologoAnestesista?: string | null;
  instrumentista?: string | null;
  circulante?: string | null;
  ayudantes?: string | null;
  observaciones?: string | null;
  
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface CreateOperatingRoomRequestData {
  diagnosticoPreoperatorio: string;
  tipoAnestesia?: string;
  instrumentoEspecial?: string;
  horaSolicitud?: string;
  horaLlegadaQx?: string;
  horaEntraQx?: string;
  horaAnestesia?: string;
  horaInicioQx?: string;
  horaFinQx?: string;
  horaSaleQx?: string;
  horaRecibeRecuperacion?: string;
  horaSaleRecuperacion?: string;
  usoSangre?: boolean;
  entregaOportunaSangre?: boolean;
  complicacion?: boolean;
  tipoComplicacion?: string;
  contaminacionQuirofano?: boolean;
  fumigaQuirofanoPor?: string;
  tiempo?: string;
  medicoSolicitante?: string;
  anestesiologoAnestesista?: string;
  instrumentista?: string;
  circulante?: string;
  ayudantes?: string;
  observaciones?: string;
}

// ============================================
// LISTA DE VERIFICACIÓN DE CIRUGÍA SEGURA
// ============================================

export interface SafetyChecklistEntrada {
  id: string;
  safetyChecklistId: string;
  confirmaIdentidad: boolean;
  confirmaLocalizacion: boolean;
  confirmaProcedimiento: boolean;
  confirmaConsentimiento: boolean;
  confirmaMarca: boolean;
  verificacionSeguridad: boolean;
  alergiasConocidas: boolean;
  detallesAlergias?: string | null;
  dificultadViaArea: boolean;
  accesoIVAdecuado: boolean;
  esterilidad: boolean;
  profilaxisAntibiotica: boolean;
  imagenesEsenciales: boolean;
  createdAt: string | Date;
}

export interface CreateSafetyChecklistEntradaData {
  confirmaIdentidad?: boolean;
  confirmaLocalizacion?: boolean;
  confirmaProcedimiento?: boolean;
  confirmaConsentimiento?: boolean;
  confirmaMarca?: boolean;
  verificacionSeguridad?: boolean;
  alergiasConocidas?: boolean;
  detallesAlergias?: string;
  dificultadViaArea?: boolean;
  accesoIVAdecuado?: boolean;
  esterilidad?: boolean;
  profilaxisAntibiotica?: boolean;
  imagenesEsenciales?: boolean;
}

export interface SafetyChecklistPausa {
  id: string;
  safetyChecklistId: string;
  confirmacionEquipo: boolean;
  confirmaPaciente: boolean;
  confirmaSitio: boolean;
  confirmaProcedimiento: boolean;
  pasosCriticos?: string | null;
  preocupacionesAnestesia?: string | null;
  createdAt: string | Date;
}

export interface CreateSafetyChecklistPausaData {
  confirmacionEquipo?: boolean;
  confirmaPaciente?: boolean;
  confirmaSitio?: boolean;
  confirmaProcedimiento?: boolean;
  pasosCriticos?: string;
  preocupacionesAnestesia?: string;
}

export interface SafetyChecklistSalida {
  id: string;
  safetyChecklistId: string;
  nombreProcedimiento: boolean;
  conteoGasas: boolean;
  conteoAgujas: boolean;
  identificacionMuestras: boolean;
  problemasEquipo: boolean;
  profilaxisTromboembolia: boolean;
  createdAt: string | Date;
}

export interface CreateSafetyChecklistSalidaData {
  nombreProcedimiento?: boolean;
  conteoGasas?: boolean;
  conteoAgujas?: boolean;
  identificacionMuestras?: boolean;
  problemasEquipo?: boolean;
  profilaxisTromboembolia?: boolean;
}

export interface SafetyChecklist {
  id: string;
  surgeryId: string;
  createdAt: string | Date;
  updatedAt: string | Date;
  entrada?: SafetyChecklistEntrada | null;
  pausa?: SafetyChecklistPausa | null;
  salida?: SafetyChecklistSalida | null;
}

// ============================================
// MATERIALES UTILIZADOS
// ============================================

export interface UsedMaterials {
  id: string;
  surgeryId: string;
  gasas?: string | null;
  torundas?: string | null;
  compresas?: string | null;
  aseptosan?: string | null;
  cloruro?: string | null;
  povedine?: string | null;
  sondaFoley?: string | null;
  bolsaRecolectoraOrina?: string | null;
  bisturiNo?: string | null;
  guantesEsterilesTallas?: string | null;
  suturas?: string | null;
  espadadraspo?: string | null;
  jeringas?: string | null;
  bolsaMuestraBiopsia?: string | null;
  manigtas?: string | null;
  lubricante?: string | null;
  otros?: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface CreateUsedMaterialsData {
  gasas?: string;
  torundas?: string;
  compresas?: string;
  aseptosan?: string;
  cloruro?: string;
  povedine?: string;
  sondaFoley?: string;
  bolsaRecolectoraOrina?: string;
  bisturiNo?: string;
  guantesEsterilesTallas?: string;
  suturas?: string;
  espadadraspo?: string;
  jeringas?: string;
  bolsaMuestraBiopsia?: string;
  manigtas?: string;
  lubricante?: string;
  otros?: string;
}

// ============================================
// SURGERY CON TODAS LAS RELACIONES
// ============================================

export interface SurgeryWithRelations extends Surgery {
  operativeNote?: OperativeNote | null;
  medicalOrders?: SurgeryMedicalOrders | null;
  anesthesiaRecord?: AnesthesiaRecord | null;
  materialControls?: MaterialControl[];
  operatingRoomRequest?: OperatingRoomRequest | null;
  safetyChecklist?: SafetyChecklist | null;
  usedMaterials?: UsedMaterials | null;
  hospitalizations?: Array<{
    id: string;
    admissionDate: string | Date;
    status: string;
  }>;
}

