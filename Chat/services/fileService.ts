// File Service - Sistema seguro de leitura de arquivos e imagens
// Processamento de anexos com validações de segurança

export interface FileUploadResult {
  success: boolean;
  file?: File;
  base64?: string;
  text?: string;
  imageData?: string;
  error?: string;
  type: 'image' | 'document' | 'text' | 'script' | 'executable';
  name: string;
  size: number;
}

export interface SecurityValidation {
  isSafe: boolean;
  reasons: string[];
  fileType: 'image' | 'document' | 'text' | 'script' | 'executable';
}

// Extensões permitidas
const ALLOWED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];
const ALLOWED_DOCUMENT_EXTENSIONS = ['.pdf', '.txt', '.doc', '.docx', '.rtf', '.md', '.md'];
const ALLOWED_CODE_EXTENSIONS = ['.js', '.ts', '.jsx', '.tsx', '.py', '.sh', '.php', '.html', '.css', '.json', '.yaml', '.yml', '.xml', '.sql'];
const DANGEROUS_EXTENSIONS = ['.exe', '.bat', '.cmd', '.com', '.scr'];

// Tipos MIME permitidos
const ALLOWED_MIME_TYPES = {
  image: [
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 
    'image/webp', 'image/bmp', 'image/svg+xml'
  ],
  document: [
    'application/pdf', 'text/plain', 'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/rtf', 'text/markdown'
  ],
  code: [
    'text/javascript', 'text/typescript', 'text/jsx', 'text/tsx',
    'text/python', 'text/x-python', 'text/x-php', 'text/html',
    'text/css', 'application/json', 'text/xml', 'text/yaml',
    'application/sql', 'text/sql', 'application/x-sh'
  ]
};

// Validação de segurança
export const validateFileSecurity = (file: File): SecurityValidation => {
  const reasons: string[] = [];
  let isSafe = true;
  let fileType: 'image' | 'document' | 'text' | 'script' | 'executable' = 'text';
  
  const extension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
  const mimeType = file.type.toLowerCase();

  // Verificar se é um arquivo de código permitido PRIMEIRO
  if (ALLOWED_CODE_EXTENSIONS.includes(extension)) {
    fileType = 'script';
    // Scripts de código são seguros para leitura e análise
  } else if (DANGEROUS_EXTENSIONS.includes(extension)) {
    // Verificar extensão perigosa (executáveis)
    reasons.push(`Extension ${extension} is not allowed for security reasons`);
    isSafe = false;
    fileType = 'executable';
  } else {
    // Verificar outros tipos permitidos
    if (ALLOWED_IMAGE_EXTENSIONS.includes(extension)) {
      fileType = 'image';
    } else if (ALLOWED_DOCUMENT_EXTENSIONS.includes(extension)) {
      fileType = 'document';
    } else if (mimeType.startsWith('text/')) {
      fileType = 'text';
    }
  }

  // Verificar tamanho (máximo 10MB)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    reasons.push(`File size exceeds maximum allowed (10MB)`);
    isSafe = false;
  }

  // Verificar nome do arquivo
  if (file.name.includes('..') || file.name.includes('/') || file.name.includes('\\')) {
    reasons.push(`Invalid filename structure`);
    isSafe = false;
  }

  return { isSafe, reasons, fileType };
};

// Ler arquivo de imagem
const readImageFile = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      // Converter para formato webp se necessário
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context not available'));
          return;
        }
        
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        // Converter para webp se for muito grande
        const maxSize = 1920;
        let { width, height } = img;
        
        if (width > maxSize || height > maxSize) {
          const ratio = Math.min(maxSize / width, maxSize / height);
          width *= ratio;
          height *= ratio;
          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(img, 0, 0, width, height);
        }
        
        const optimizedBase64 = canvas.toDataURL('image/webp', 0.8);
        resolve(optimizedBase64);
      };
      img.onerror = () => reject(new Error('Invalid image file'));
      img.src = base64;
    };
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.readAsDataURL(file);
  });
};

// Ler arquivo de texto/código
const readTextFile = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      
      // Para arquivos de código, permitimos a leitura mas adicionamos aviso
      const extension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
      if (ALLOWED_CODE_EXTENSIONS.includes(extension)) {
        // Scripts de código são permitidos para análise
        resolve(text);
      } else {
        // Para outros textos, ainda verificamos conteúdo perigoso
        const dangerousPatterns = [
          /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
          /javascript:/gi,
          /on\w+\s*=/gi,
          /eval\(/gi
        ];
        
        const hasDangerousContent = dangerousPatterns.some(pattern => pattern.test(text));
        if (hasDangerousContent) {
          reject(new Error('File contains potentially dangerous content'));
          return;
        }
        
        resolve(text);
      }
    };
    reader.onerror = () => reject(new Error('Failed to read text file'));
    reader.readAsText(file);
  });
};

// Ler arquivo PDF (simplificado)
const readPDFFile = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    // Por enquanto, retornamos apenas o nome e tamanho
    // Em uma implementação completa, usaríamos uma biblioteca como PDF.js
    resolve(`PDF Document: ${file.name} (${Math.round(file.size / 1024)}KB)`);
  });
};

// Função principal de processamento
export const processFile = async (file: File): Promise<FileUploadResult> => {
  try {
    // Validar segurança
    const security = validateFileSecurity(file);
    if (!security.isSafe) {
      return {
        success: false,
        error: `Security validation failed: ${security.reasons.join(', ')}`,
        type: 'text',
        name: file.name,
        size: file.size
      };
    }

    let result: FileUploadResult = {
      success: true,
      file,
      type: security.fileType,
      name: file.name,
      size: file.size
    };

    // Processar baseado no tipo
    switch (security.fileType) {
      case 'image':
        result.imageData = await readImageFile(file);
        result.base64 = result.imageData;
        break;
        
      case 'document':
        if (file.type === 'application/pdf') {
          result.text = await readPDFFile(file);
        } else {
          result.text = await readTextFile(file);
        }
        break;
        
      case 'text':
      case 'script':
        result.text = await readTextFile(file);
        break;
        
      default:
        return {
          success: false,
          error: 'File type not supported',
          type: 'text',
          name: file.name,
          size: file.size
        };
    }

    return result;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      type: 'text',
      name: file.name,
      size: file.size
    };
  }
};

// Múltiplos arquivos
export const processMultipleFiles = async (files: File[]): Promise<FileUploadResult[]> => {
  const results: FileUploadResult[] = [];
  
  for (const file of files) {
    const result = await processFile(file);
    results.push(result);
  }
  
  return results;
};

// Validar arquivo antes do upload
export const validateFileForUpload = (file: File): { isValid: boolean; error?: string } => {
  const extension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
  
  // Verificar extensão
  const isAllowedExtension = 
    ALLOWED_IMAGE_EXTENSIONS.includes(extension) ||
    ALLOWED_DOCUMENT_EXTENSIONS.includes(extension) ||
    ALLOWED_CODE_EXTENSIONS.includes(extension);
    
  if (!isAllowedExtension) {
    return {
      isValid: false,
      error: `File type ${extension} is not supported`
    };
  }

  // Verificar MIME type
  const allAllowedMimes = [
    ...Object.values(ALLOWED_MIME_TYPES).flat(),
    'text/javascript', 'text/typescript', 'text/python', 'text/x-python',
    'text/html', 'text/css', 'application/json', 'text/yaml',
    'application/sql', 'text/sql', 'application/x-sh'
  ];
  
  if (!allAllowedMimes.includes(file.type) && !file.type.startsWith('text/')) {
    return {
      isValid: false,
      error: `MIME type ${file.type} is not supported`
    };
  }

  // Verificar tamanho
  if (file.size > 10 * 1024 * 1024) { // 10MB
    return {
      isValid: false,
      error: 'File size exceeds 10MB limit'
    };
  }

  return { isValid: true };
};

// Extrair texto de imagem usando OCR (simulado)
export const extractTextFromImage = async (imageData: string): Promise<string> => {
  // Simulação de OCR
  // Em produção, usaríamos Tesseract.js ou API de OCR
  return "Text extraction from image would be implemented here";
};

// Obter preview de arquivo
export const getFilePreview = (result: FileUploadResult): string => {
  if (!result.success) return `Error: ${result.error}`;
  
  switch (result.type) {
    case 'image':
      return `📸 Image: ${result.name} (${Math.round(result.size / 1024)}KB)`;
    case 'document':
      return `📄 Document: ${result.name} (${Math.round(result.size / 1024)}KB)`;
    case 'text':
      return `📝 Text: ${result.name} (${Math.round(result.size / 1024)}KB)`;
    case 'script':
      return `💻 Code: ${result.name} (${Math.round(result.size / 1024)}KB)`;
    default:
      return `📁 File: ${result.name}`;
  }
};

// Log para debug
export const logFileProcessing = (result: FileUploadResult) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('📁 File Processing Result:', {
      name: result.name,
      type: result.type,
      size: result.size,
      success: result.success,
      error: result.error
    });
  }
};
