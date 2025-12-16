/**
 * Показывает уведомление о приезде такси
 */
function showArrivalNotification() {
    // Создаем элемент уведомления
    const notification = document.createElement('div');
    notification.className = 'arrival-notification';
    notification.innerHTML = `
        <div class="notification-content">
            <h2>🚕 Такси приехало!</h2>
            <p>Водитель ждет вас у подъезда</p>
            <p style="margin-top: 15px; font-size: 0.9em; color: #666;">
                Номер водителя: <strong>+7 (999) ${Math.floor(Math.random() * 9000) + 1000}</strong>
            </p>
            <button onclick="this.parentElement.parentElement.remove()" class="btn-close">Закрыть</button>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Автоматически закрывает уведомление через 10 секунд
    setTimeout(function() {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 10000);
}

/**
 * Показывает уведомление о завершении поездки
 */
function showCompletionNotification() {
    // Создаем элемент уведомления
    const notification = document.createElement('div');
    notification.className = 'arrival-notification';
    notification.innerHTML = `
        <div class="notification-content">
            <h2>✓ Поездка завершена!</h2>
            <p>Спасибо за использование наших услуг</p>
            <p style="margin-top: 15px; font-size: 1.2em; color: #667eea;">
                <strong>Итого: 350 ₽</strong>
            </p>
            <button onclick="location.reload()" class="btn-close">Новый заказ</button>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Автоматически закрывает уведомление через 10 секунд
    setTimeout(function() {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 10000);
}

// Получаем элементы формы
const form = document.getElementById('taxiForm');
const pickupInput = document.getElementById('pickup');
const dropoffInput = document.getElementById('dropoff');
const priceElement = document.getElementById('price');
const successMessage = document.getElementById('successMessage');
const orderDetails = document.getElementById('orderDetails');
const distanceInfo = document.getElementById('distanceInfo');
const distanceValue = document.getElementById('distanceValue');
const timeValue = document.getElementById('timeValue');
const routeMap = document.getElementById('routeMap');
const routeText = document.getElementById('routeText');

// Переменная для хранения карты
let map = null;

// База популярных мест в Москве с координатами (широта, долгота)
const moscowPlaces = {
    'красная площадь': { lat: 55.7558, lon: 37.6173, name: 'Красная площадь' },
    'кремль': { lat: 55.7525, lon: 37.6231, name: 'Кремль' },
    'большой театр': { lat: 55.7590, lon: 37.6193, name: 'Большой театр' },
    'третьяковская галерея': { lat: 55.7439, lon: 37.6195, name: 'Третьяковская галерея' },
    'петровский дворец': { lat: 55.8160, lon: 37.6018, name: 'Петровский дворец' },
    'центральный парк культуры': { lat: 55.7184, lon: 37.6026, name: 'ЦПКиО им. Горького' },
    'москва-река': { lat: 55.7505, lon: 37.6202, name: 'Москва-река' },
    'мгу на воробьевых горах': { lat: 55.7387, lon: 37.5293, name: 'МГУ на Воробьевых горах' },
    'вокзал казанский': { lat: 55.7647, lon: 37.6540, name: 'Казанский вокзал' },
    'вокзал ленинградский': { lat: 55.7773, lon: 37.6527, name: 'Ленинградский вокзал' },
    'вокзал ярославский': { lat: 55.7790, lon: 37.6532, name: 'Ярославский вокзал' },
    'царицыно': { lat: 55.6725, lon: 37.6979, name: 'Царицыно' },
    'коломенское': { lat: 55.6692, lon: 37.7628, name: 'Коломенское' },
    'измайлово': { lat: 55.7876, lon: 37.7892, name: 'Измайлово' },
    'новодевичий монастырь': { lat: 55.7339, lon: 37.5518, name: 'Новодевичий монастырь' },
    'теплый стан': { lat: 55.6395, lon: 37.4852, name: 'Ул. Теплый стан 3 к.1' },
    'большая семеновская': { lat: 55.7865, lon: 37.7265, name: 'Ул. Большая Семёновская 38' },
};

// Коэффициенты для расчета стоимости
const BASE_PRICE = 100; // Базовая стоимость в рублях
const PRICE_PER_KM = 30; // Стоимость за километр
const NIGHT_MULTIPLIER = 1.5; // Коэффициент для ночного времени

/**
 * Вычисляет расстояние между двумя точками по формуле Haversine
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Радиус Земли в км
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 10) / 10; // Округляем до одного знака
}

/**
 * Вычисляет время поездки на основе расстояния и пробок в Москве
 * В среднем скорость 30-40 км/ч с учетом пробок
 */
function calculateTravelTime(distance) {
    const averageSpeed = 35; // км/ч с учетом пробок
    return Math.round((distance / averageSpeed) * 60); // Время в минутах
}

/**
 * Генерирует описание маршрута
 */
function generateRouteDescription(pickup, dropoff) {
    const routes = [
        `${pickup} → ${dropoff}`,
        `Маршрут: ${pickup} через центр города → ${dropoff}`,
        `${pickup} → (по дороге) → ${dropoff}`,
    ];
    return routes[Math.floor(Math.random() * routes.length)];
}

/**
 * Инициализирует и показывает карту с маршрутом (Яндекс Карты)
 */
function initializeMap(pickupPlace, dropoffPlace) {
    const mapContainer = document.getElementById('mapContainer');
    
    // Очищаем контейнер
    mapContainer.innerHTML = '';
    
    // Инициализируем карту
    ymaps.ready(function () {
        const map = new ymaps.Map(mapContainer, {
            center: [(pickupPlace.lat + dropoffPlace.lat) / 2, (pickupPlace.lon + dropoffPlace.lon) / 2],
            zoom: 12
        });
        
        // Маркер отправления (красный)
        const startMarker = new ymaps.Placemark(
            [pickupPlace.lat, pickupPlace.lon],
            {
                balloonContent: `<strong>${pickupPlace.name}</strong><br>Отправление`
            },
            {
                preset: 'islands#redCircleDotIcon',
                iconImageHref: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgdmlld0JveD0iMCAwIDQwIDQwIj48Y2lyY2xlIGN4PSIyMCIgY3k9IjIwIiByPSIxNiIgZmlsbD0iI0ZGNkI2QiIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIyIi8+PC9zdmc+'
            }
        );
        
        // Маркер назначения (зелёный)
        const endMarker = new ymaps.Placemark(
            [dropoffPlace.lat, dropoffPlace.lon],
            {
                balloonContent: `<strong>${dropoffPlace.name}</strong><br>Назначение`
            },
            {
                preset: 'islands#greenCircleDotIcon',
                iconImageHref: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgdmlld0JveD0iMCAwIDQwIDQwIj48Y2lyY2xlIGN4PSIyMCIgY3k9IjIwIiByPSIxNiIgZmlsbD0iIzRDQUY1MCIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIyIi8+PC9zdmc+'
            }
        );
        
        // Добавляем маркеры на карту
        map.geoObjects.add(startMarker);
        map.geoObjects.add(endMarker);
        
        // Рисуем маршрут линией
        const routeLine = new ymaps.Polyline(
            [[pickupPlace.lat, pickupPlace.lon], [dropoffPlace.lat, dropoffPlace.lon]],
            {},
            {
                strokeColor: '#FF6B6B',
                strokeWidth: 3,
                strokeOpacity: 0.8
            }
        );
        
        map.geoObjects.add(routeLine);
        
        // Масштабируем карту под маршрут
        map.setBounds(map.geoObjects.getBounds());
    });
}

/**
 * Находит место в базе по названию (без учета регистра)
 */
function findPlace(locationName) {
    const normalized = locationName.toLowerCase().trim();
    return moscowPlaces[normalized] || null;
}

/**
 * Проверяет, является ли текущее время ночным (21:00 - 06:00)
 */
function isNightTime() {
    const hour = new Date().getHours();
    return hour >= 21 || hour < 6;
}

/**
 * Рассчитывает примерную стоимость поездки
 * Формула: базовая стоимость + (расстояние * стоимость за км) * коэффициент времени
 */
function calculatePrice(distance) {
    let multiplier = isNightTime() ? NIGHT_MULTIPLIER : 1;
    return Math.round((BASE_PRICE + distance * PRICE_PER_KM) * multiplier);
}

/**
 * Обновляет цену и маршрут при изменении полей ввода
 */
function updatePrice() {
    // Проверяем, заполнены ли оба поля
    if (pickupInput.value.trim() && dropoffInput.value.trim()) {
        const pickupPlace = findPlace(pickupInput.value);
        const dropoffPlace = findPlace(dropoffInput.value);

        if (pickupPlace && dropoffPlace) {
            // Вычисляем расстояние между двумя точками
            const distance = calculateDistance(
                pickupPlace.lat, 
                pickupPlace.lon, 
                dropoffPlace.lat, 
                dropoffPlace.lon
            );

            // Вычисляем время поездки
            const travelTime = calculateTravelTime(distance);

            // Рассчитываем цену
            const price = calculatePrice(distance);

            // Отображаем маршрут, расстояние, время и цену
            routeText.textContent = generateRouteDescription(pickupPlace.name, dropoffPlace.name);
            routeMap.style.display = 'block';
            distanceValue.textContent = distance;
            timeValue.textContent = travelTime;
            distanceInfo.style.display = 'block';
            priceElement.textContent = price + ' ₽';
            
            // Инициализируем карту с маршрутом
            initializeMap(pickupPlace, dropoffPlace);
        } else {
            // Если места не найдены в базе, скрываем информацию
            routeMap.style.display = 'none';
            distanceInfo.style.display = 'none';
            priceElement.textContent = '0 ₽';
        }
    } else {
        // Скрываем информацию, если поля не заполнены
        routeMap.style.display = 'none';
        distanceInfo.style.display = 'none';
        priceElement.textContent = '0 ₽';
    }
}

/**
 * Обрабатывает отправку формы
 */
form.addEventListener('submit', function(e) {
    e.preventDefault(); // Отменяем стандартную отправку формы

    // Получаем введенные данные
    const pickup = pickupInput.value.trim();
    const dropoff = dropoffInput.value.trim();
    const price = priceElement.textContent;
    const distance = distanceValue.textContent;
    const time = timeValue.textContent;

    // Проверяем, заполнены ли все поля и найдены ли места
    const pickupPlace = findPlace(pickup);
    const dropoffPlace = findPlace(dropoff);

    if (!pickupPlace || !dropoffPlace) {
        alert('Пожалуйста, выберите места из списка рекомендаций');
        return;
    }

    // Скрываем форму
    form.style.display = 'none';

    // Отображаем сообщение об успешном заказе
    successMessage.style.display = 'block';
    orderDetails.innerHTML = `
        <strong>От:</strong> ${pickupPlace.name}<br>
        <strong>До:</strong> ${dropoffPlace.name}<br>
        <strong>Расстояние:</strong> ${distance} км<br>
        <strong>Время в пути:</strong> ${time} минут<br>
        <strong>Стоимость:</strong> ${price}
    `;

    // Показываем номер заказа (простая имитация)
    const orderNumber = Math.floor(Math.random() * 10000) + 1000;
    const heading = successMessage.querySelector('h2');
    heading.innerHTML = `✓ Заказ №${orderNumber} принят!`;

    // Через 20 секунд показываем уведомление о приезде такси
    setTimeout(function() {
        showArrivalNotification();
    }, 20000); // 20000 миллисекунд = 20 секунд

    // Через 40 секунд показываем уведомление о завершении поездки
    setTimeout(function() {
        showCompletionNotification();
    }, 40000); // 40000 миллисекунд = 40 секунд (20 + 20)
});

/**
 * Добавляем слушатель события для обновления цены при изменении полей
 */
pickupInput.addEventListener('input', updatePrice);
dropoffInput.addEventListener('input', updatePrice);

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    console.log('Приложение TaxiBook загружено');
});
