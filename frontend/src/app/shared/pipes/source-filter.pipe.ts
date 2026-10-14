import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'sourceFilter'
})
export class SourceFilterPipe implements PipeTransform {
  transform(items: any[] | null | undefined, source: string): any[] {
    if (!items) return [];
    return items.filter(v => v?.source === source);
  }
}