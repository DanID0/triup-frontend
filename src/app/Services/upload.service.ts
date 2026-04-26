import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';

export interface UploadResponse {
  url: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
}

@Injectable({ providedIn: 'root' })
export class UploadService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'https://dani.gavrusa.com/api';

  async uploadImage(file: File): Promise<UploadResponse> {
    const form = new FormData();
    form.append('file', file);
    const res = await lastValueFrom(
      this.http.post<UploadResponse>(`${this.apiUrl}/upload/image`, form, {
        withCredentials: true,
      }),
    );
    return { ...res, url: this.absoluteUrl(res.url) };
  }

  absoluteUrl(url: string | null | undefined): string {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `${this.apiUrl}${url.startsWith('/') ? '' : '/'}${url}`;
  }
}
