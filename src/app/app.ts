import { Component, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';

type Platform = 'minecraft' | 'steam' | 'xbox' | 'hytale';

interface PlayerResponse {
  success?: boolean;
  message?: string;
  data?: { player?: { username?: string; id?: string; avatar?: string } };
}

@Component({
  imports: [FormsModule],
  selector: 'app-root',
  templateUrl: './app.html',
})
export class App {
  protected query = '';
  protected platform: Platform = 'minecraft';
  protected readonly platforms: { id: Platform; name: string }[] = [
    { id: 'minecraft', name: 'Minecraft' },
    { id: 'steam', name: 'Steam' },
    { id: 'xbox', name: 'Xbox' },
    { id: 'hytale', name: 'Hytale' },
  ];
  protected readonly player = signal<{ username: string; id: string; avatar?: string; platform: Platform } | null>(null);
  protected readonly loading = signal(false);
  protected readonly error = signal('');

  constructor(private readonly http: HttpClient) {}

  protected async search(): Promise<void> {
    const name = this.query.trim();
    if (!name || this.loading()) return;

    this.loading.set(true);
    this.error.set('');
    this.player.set(null);

    try {
      const response = await firstValueFrom(
        this.http.get<PlayerResponse>(`https://playerdb.co/api/player/${this.platform}/${encodeURIComponent(name)}`),
      );
      const found = response.data?.player;
      if (!response.success || !found?.username) {
        throw new Error(response.message || 'No player found. Check the name and try again.');
      }
      this.player.set({ username: found.username, id: found.id || '', avatar: found.avatar, platform: this.platform });
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'Could not reach PlayerDB. Please try again.');
    } finally {
      this.loading.set(false);
    }
  }
}
