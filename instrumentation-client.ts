// Inicializa o dataLayer antes do GTM e de qualquer componente carregar.
// Eventos empurrados antes do GTM carregar ficam na fila e são processados
// quando o GTM inicializa — nenhum dado é perdido.
window.dataLayer = window.dataLayer || []
