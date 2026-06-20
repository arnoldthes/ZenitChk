import { guncelleHareket, yilan } from './input.js';
import { cizimYap } from './render.js';

let sonGuncellemeZamani = 0;
const HIZ = 5; // Oyun hızı

function anaDongu(suankiZaman) {
    window.requestAnimationFrame(anaDongu);
    const saniyeFarki = (suankiZaman - sonGuncellemeZamani) / 1000;
    if (saniyeFarki < 1 / HIZ) return;
    
    sonGuncellemeZamani = suankiZaman;
    
    oyunGuncelle();
    oyunCiz();
}

function oyunGuncelle() {
    guncelleHareket();
    // Burada çarpışma kontrolü, puan sistemi, yılan büyüme mantığı 
    // gibi yaklaşık 200 satırlık fonksiyonları çağırmalısın.
}

function oyunCiz() {
    cizimYap(yilan);
}

window.requestAnimationFrame(anaDongu);
