window.initMap = async function(city) {
    const map = L.map('map').setView([41.9981, 21.4254], 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    const res = await fetch('/api/tenants?city=' + encodeURIComponent(city));
    const tenants = await res.json();
    console.log(tenants)
    tenants.forEach(t => {
        if (!t.latitude || !t.longitude) return;
        const marker = L.marker([t.latitude, t.longitude]).addTo(map);
        marker.bindPopup(`<b>${t.name}</b><br/>${t.address}<br/><a href='/tenant/dashboard?tenantId=${t.id}'>Manage</a>`);
    });
};