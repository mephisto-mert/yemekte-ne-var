/**
 * Recipe Import CLI Tool.
 * 
 * SAFETY GUARD:
 * Defaults to dry-run simulation mode.
 * Explicit production import is strictly blocked in PART 10 without explicit --confirm and IMPORT_CONFIRM=true.
 */

const args = process.argv.slice(2);
const hasConfirm = args.includes('--confirm');
const envConfirm = process.env.IMPORT_CONFIRM === 'true';

console.log('\n====================================================');
console.log('       RECIPE IMPORT CLI — PRODUCTION GATEWAY       ');
console.log('====================================================');

if (!hasConfirm || !envConfirm) {
  console.log('[GÜVENLİK KORUMASI DEVREDE]');
  console.log('Mevcut mod: DRY-RUN (Salt-Okunur Simülasyon)');
  console.log('Üretim veri setine yazma işlemi kilitlidir.');
  console.log('\nGerçek içe aktarımı doğrulamak için:');
  console.log('  1. Komut argümanı: --confirm');
  console.log('  2. Ortam değişkeni: IMPORT_CONFIRM=true');
  console.log('----------------------------------------------------');
  console.log('Simülasyon başlatılıyor...\n');
  require('./recipe_import_dry_run.cjs');
} else {
  console.log('[UYARI] --confirm bayrağı ve IMPORT_CONFIRM algılandı.');
  console.log('PART 10 mimari kuralları gereği gerçek toplu veri yazımı kilitlenmiştir.');
  console.log('Production dataset ve Supabase mutasyonu PART 11 için rezerve edilmiştir.');
  console.log('====================================================\n');
  process.exit(0);
}
