import { Component, EventEmitter, Input, Output } from '@angular/core';

export interface ContactImportPreview {
  total: number;
  ready: number;
  ignored: number;
  hasReadyRows: boolean;
}

interface ContactPreviewRow {
  fullName: string;
  phoneNumber: string;
  email: string;
  country: string;
  jobTitle: string;
  organization: string;
  company: string;
  isValid: boolean;
  reason: string;
}

@Component({
  selector: 'app-previsualize-data-file',
  templateUrl: './previsualize-data-file.component.html',
  styleUrls: ['./previsualize-data-file.component.scss']
})
export class PrevisualizeDataFileComponent {
  private _file: File = null;
  private _readRequest = 0;
  private readonly _previewLimit = 50;

  @Output() previewChange = new EventEmitter<ContactImportPreview>();

  file: File = null;
  headers: string[] = [];
  rows: ContactPreviewRow[] = [];
  previewRows: ContactPreviewRow[] = [];
  hiddenRows = 0;
  total = 0;
  readyCount = 0;
  ignoredCount = 0;
  loading = false;
  error = '';

  @Input('file') set fileInput(file: File) {
    if (file === this._file) return;
    this._file = file;
    this.file = file;
    this.analyseFile();
  }

  get fileInput(): File {
    return this._file;
  }

  trackByIndex(index: number): number {
    return index;
  }

  private analyseFile(): void {
    this.resetPreview();
    if (!this._file) return;

    if (!/\.csv$/i.test(this._file.name)) {
      this.error = 'Le fichier sélectionné doit être au format CSV.';
      this.emitPreview();
      return;
    }

    const request = ++this._readRequest;
    const reader = new FileReader();
    this.loading = true;

    reader.onload = () => {
      if (request !== this._readRequest) return;
      this.loading = false;
      this.parseContent(String(reader.result || ''));
    };

    reader.onerror = () => {
      if (request !== this._readRequest) return;
      this.loading = false;
      this.error = 'Impossible de lire le fichier sélectionné.';
      this.emitPreview();
    };

    reader.readAsText(this._file);
  }

  private resetPreview(): void {
    this._readRequest++;
    this.headers = [];
    this.rows = [];
    this.previewRows = [];
    this.hiddenRows = 0;
    this.total = 0;
    this.readyCount = 0;
    this.ignoredCount = 0;
    this.loading = false;
    this.error = '';
  }

  private parseContent(content: string): void {
    const matrix = this.parseCsv(content.replace(/^\uFEFF/, ''))
      .filter((row) => row.some((cell) => String(cell ?? '').trim() !== ''));

    if (matrix.length === 0) {
      this.error = 'Le fichier CSV est vide.';
      this.emitPreview();
      return;
    }

    this.headers = matrix[0].map((header) =>
      String(header ?? '').replace(/^\uFEFF/, '').trim().toLowerCase()
    );

    if (matrix.length === 1) {
      this.error = 'Le fichier CSV ne contient aucune ligne de contact.';
      this.emitPreview();
      return;
    }

    const seenPhones = new Set<string>();
    const seenNames = new Set<string>();

    this.rows = matrix.slice(1).map((row) => {
      const fullName = this.pick(row, ['fullname', 'full_name', 'name', 'nom', 'nomcomplet', 'nom_complet']);
      const phoneNumber = this.pick(row, ['phonenumber', 'phone_number', 'phone', 'telephone', 'tel', 'whatsappcontact', 'whatsapp_contact', 'numero', 'number']);
      const email = this.pick(row, ['email', 'email_default', 'mail']);
      const country = this.pick(row, ['country', 'pays']);
      const jobTitle = this.pick(row, ['jobtitle', 'job_title', 'poste', 'fonction']);
      const organization = this.pick(row, ['organization', 'organisation']);
      const company = this.pick(row, ['company', 'entreprise', 'societe']);
      const cleanPhone = phoneNumber.replace(/[^\d+]/g, '');
      const nameKey = fullName.trim().toLowerCase();
      const phoneKey = cleanPhone;

      let isValid = true;
      let reason = '';

      if (!fullName || !phoneNumber) {
        isValid = false;
        reason = 'Nom complet ou numéro manquant';
      } else if (cleanPhone.replace(/\D/g, '').length < 6) {
        isValid = false;
        reason = 'Numéro de téléphone invalide';
      } else if (seenPhones.has(phoneKey) || (nameKey && seenNames.has(nameKey))) {
        isValid = false;
        reason = 'Doublon dans le fichier';
      }

      if (isValid) {
        seenPhones.add(phoneKey);
        if (nameKey) seenNames.add(nameKey);
      }

      return {
        fullName,
        phoneNumber: cleanPhone || phoneNumber,
        email,
        country,
        jobTitle,
        organization,
        company,
        isValid,
        reason
      };
    });

    this.total = this.rows.length;
    this.readyCount = this.rows.filter((row) => row.isValid).length;
    this.ignoredCount = this.total - this.readyCount;
    this.previewRows = this.rows.slice(0, this._previewLimit);
    this.hiddenRows = Math.max(0, this.total - this.previewRows.length);

    if (this.readyCount === 0) {
      this.error = 'Aucun contact valide détecté. Vérifiez que les colonnes "fullName" et "phoneNumber" sont présentes et renseignées.';
    }

    this.emitPreview();
  }

  private emitPreview(): void {
    this.previewChange.emit({
      total: this.total,
      ready: this.readyCount,
      ignored: this.ignoredCount,
      hasReadyRows: this.readyCount > 0
    });
  }

  private pick(row: string[], keys: string[]): string {
    for (const key of keys) {
      const index = this.headers.indexOf(key);
      if (index === -1) continue;
      const value = String(row[index] ?? '').trim();
      if (value) return value;
    }
    return '';
  }

  private parseCsv(content: string): string[][] {
    const rows: string[][] = [];
    let row: string[] = [];
    let field = '';
    let inQuotes = false;

    for (let index = 0; index < content.length; index++) {
      const char = content[index];

      if (char === '"') {
        if (inQuotes && content[index + 1] === '"') {
          field += '"';
          index++;
        } else {
          inQuotes = !inQuotes;
        }
        continue;
      }

      if (char === ',' && !inQuotes) {
        row.push(field);
        field = '';
        continue;
      }

      if ((char === '\n' || char === '\r') && !inQuotes) {
        if (char === '\r' && content[index + 1] === '\n') index++;
        row.push(field);
        rows.push(row);
        row = [];
        field = '';
        continue;
      }

      field += char;
    }

    row.push(field);
    rows.push(row);

    return rows;
  }
}
