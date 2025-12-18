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

// Переменные для анимации маршрута
let currentRouteCoordinates = null;
let taxiMarker = null;
let animationInterval = null;

// База данных машин для демонстрации
const taxiCars = [
    { brand: 'Toyota', model: 'Camry', color: 'Чёрный' },
    { brand: 'Lada', model: 'Vesta', color: 'Жёлтый' },
    { brand: 'Volkswagen', model: 'Polo', color: 'Белый' },
    { brand: 'Hyundai', model: 'Solaris', color: 'Серебристый' },
    { brand: 'Skoda', model: 'Octavia', color: 'Синий' },
    { brand: 'Lada', model: 'Granta', color: 'Белый' },
    { brand: 'Kia', model: 'Rio', color: 'Красный' },
    { brand: 'Renault', model: 'Logan', color: 'Чёрный' }
];

/**
 * Генерирует случайный российский номер машины (формат: А123БВ777)
 */
function generateRussianPlateNumber() {
    const russianLetters = 'АБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ';
    
    // Функция для получения случайной русской буквы
    const getRandomLetter = () => russianLetters[Math.floor(Math.random() * russianLetters.length)];
    
    // Функция для получения случайной цифры
    const getRandomDigit = () => Math.floor(Math.random() * 10);
    
    // Функция для получения трёх случайных цифр (региона)
    const getRegionCode = () => {
        const regions = ['77', '78', '97', '98', '66', '99', '52', '102', '05', '196']; // Популярные регионы РФ
        return regions[Math.floor(Math.random() * regions.length)] + getRandomDigit();
    };
    
    // Формат: А123БВ777 (буква, 3 цифры, 2 буквы, 3 цифры)
    const plate = `${getRandomLetter()}${getRandomDigit()}${getRandomDigit()}${getRandomDigit()}${getRandomLetter()}${getRandomLetter()}${getRegionCode()}`;
    return plate;
}

/**
 * Возвращает случайную машину из базы
 */
function getRandomCar() {
    return taxiCars[Math.floor(Math.random() * taxiCars.length)];
}

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
        const newMap = new ymaps.Map(mapContainer, {
            center: [(pickupPlace.lat + dropoffPlace.lat) / 2, (pickupPlace.lon + dropoffPlace.lon) / 2],
            zoom: 12,
            controls: ['zoomControl']
        });

        // Сохраняем ссылку на карту в глобальную переменную
        map = newMap;

        // Пытаемся построить дорожный маршрут (по дорогам). В случае ошибки — используем OSRM как fallback.
        ymaps.route([
            [pickupPlace.lat, pickupPlace.lon],
            [dropoffPlace.lat, dropoffPlace.lon]
        ], { routingMode: 'auto' })
        .then(function (route) {
            // Добавляем маршрут на карту (маршрут содержит точки и линию по дороге)
            map.geoObjects.removeAll();
            map.geoObjects.add(route);
            // Устанавливаем вид по границам маршрута
            const bounds = route.getBounds();
            if (bounds) {
                map.setBounds(bounds, { checkZoomRange: true });
            }
        }, function (err) {
            console.warn('Не удалось построить дорожный маршрут Яндексом, пробую OSRM:', err);
            // Попробуем построить маршрут через OSRM (публичный роутер) — работает без API-ключа
            drawOsrmRoute(pickupPlace, dropoffPlace)
            .then(function(osrmPolyline) {
                map.geoObjects.removeAll();
                map.geoObjects.add(osrmPolyline);
                // Добавим маркеры
                const startMarker = new ymaps.Placemark([pickupPlace.lat, pickupPlace.lon], { balloonContent: `<strong>${pickupPlace.name}</strong><br>Отправление` }, { preset: 'islands#redCircleDotIcon' });
                const endMarker = new ymaps.Placemark([dropoffPlace.lat, dropoffPlace.lon], { balloonContent: `<strong>${dropoffPlace.name}</strong><br>Назначение` }, { preset: 'islands#greenCircleDotIcon' });
                map.geoObjects.add(startMarker).add(endMarker);
                // Масштабируем
                map.setBounds(osrmPolyline.getBounds(), { checkZoomRange: true });
            })
            .catch(function(osrmErr) {
                console.error('OSRM fallback failed:', osrmErr);
                // Если OSRM тоже не сработал — фолбек к простым маркерам без прямой линии
                const startMarker = new ymaps.Placemark([pickupPlace.lat, pickupPlace.lon], { balloonContent: `<strong>${pickupPlace.name}</strong><br>Отправление` }, { preset: 'islands#redCircleDotIcon' });
                const endMarker = new ymaps.Placemark([dropoffPlace.lat, dropoffPlace.lon], { balloonContent: `<strong>${dropoffPlace.name}</strong><br>Назначение` }, { preset: 'islands#greenCircleDotIcon' });
                map.geoObjects.add(startMarker).add(endMarker);
                map.setBounds(map.geoObjects.getBounds());
            });
        });
    });
}

/**
 * Анимирует движение машины по маршруту
 */
function animateTaxiMovement() {
    if (!currentRouteCoordinates || currentRouteCoordinates.length === 0) {
        console.warn('Координаты маршрута не загружены');
        return;
    }

    if (!map) {
        console.warn('Карта не инициализирована');
        return;
    }

    // Удаляем старый маркер машины если существует
    if (taxiMarker) {
        map.geoObjects.remove(taxiMarker);
    }

    // Очищаем предыдущую анимацию
    if (animationInterval) {
        clearInterval(animationInterval);
    }

    let currentIndex = 0;
    const coords = currentRouteCoordinates;
    const speed = 5; // Меньше = быстрее, больше = медленнее (интервал в ms между обновлениями)

    // Создаем маркер такси (красный кружок с машинкой)
    taxiMarker = new ymaps.Placemark(coords[0], 
        { balloonContent: '🚕 Ваше такси в пути' },
        {
            iconImageHref: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgdmlld0JveD0iMCAwIDQwIDQwIj48Y2lyY2xlIGN4PSIyMCIgY3k9IjIwIiByPSIxNiIgZmlsbD0iI0ZGNjMzMCIvPjx0ZXh0IHg9IjIwIiB5PSIyNCIgZm9udC1zaXplPSIyNCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0id2hpdGUiPvCfkrU8L3RleHQ+PC9zdmc+',
            iconSize: [40, 40],
            iconAnchor: [20, 20],
            zIndex: 1000
        }
    );

    map.geoObjects.add(taxiMarker);

    // Запускаем анимацию
    animationInterval = setInterval(function() {
        if (currentIndex < coords.length - 1) {
            currentIndex++;
            const newCoord = coords[currentIndex];
            taxiMarker.geometry.setCoordinates(newCoord);
        } else {
            // Анимация завершена
            clearInterval(animationInterval);
            console.log('Машина добралась до пункта назначения!');
        }
    }, speed);
}

// Функция fallback с OSRM: возвращает Promise, который резолвится объектом ymaps.Polyline
function drawOsrmRoute(pickupPlace, dropoffPlace) {
    return new Promise(function(resolve, reject) {
        const lon1 = pickupPlace.lon;
        const lat1 = pickupPlace.lat;
        const lon2 = dropoffPlace.lon;
        const lat2 = dropoffPlace.lat;
        const url = `https://router.project-osrm.org/route/v1/driving/${lon1},${lat1};${lon2},${lat2}?overview=full&geometries=geojson`;

        fetch(url).then(function(resp) {
            if (!resp.ok) throw new Error('OSRM response not ok: ' + resp.status);
            return resp.json();
        }).then(function(data) {
            if (!data.routes || !data.routes.length) throw new Error('No route in OSRM response');
            const route = data.routes[0];
            const coords = route.geometry.coordinates; // [ [lon,lat], ... ]

            // Преобразуем в [lat, lon]
            const latlngs = coords.map(function(c) { return [c[1], c[0]]; });

            // Сохраняем координаты маршрута для анимации
            currentRouteCoordinates = latlngs;

            // Создаем polyline ymaps
            const poly = new ymaps.Polyline(latlngs, {}, { strokeColor: '#2A9D8F', strokeWidth: 4, strokeOpacity: 0.95 });

            // Обновим данные UI: расстояние/время/цена
            try {
                const distanceKm = Math.round((route.distance / 1000) * 10) / 10; // км
                const durationMin = Math.round(route.duration / 60); // минут
                distanceValue.textContent = distanceKm;
                timeValue.textContent = durationMin;
                const price = calculatePrice(distanceKm);
                priceElement.textContent = price + ' ₽';
                distanceInfo.style.display = 'block';
            } catch (e) {
                // ignore
            }

            resolve(poly);
        }).catch(function(err) {
            reject(err);
        });
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
 * Обрабатывает отправку формы (кнопка "Заказать такси")
 */
document.getElementById('taxiForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const pickup = pickupInput.value.trim();
    const dropoff = dropoffInput.value.trim();
    const phone = document.getElementById('phone').value.trim();
    
    if (!pickup || !dropoff || !phone) {
        alert('Пожалуйста, заполните все поля');
        return;
    }
    
    // Скрываем форму
    this.style.display = 'none';
    
    // Отображаем сообщение об успешном заказе
    const successMessage = document.getElementById('successMessage');
    successMessage.style.display = 'block';
    
    // Генерируем данные машины и номер водителя
    const car = getRandomCar();
    const driverPhone = `+7 (999) ${Math.floor(Math.random() * 9000) + 1000}`;
    const orderNumber = Math.floor(Math.random() * 10000) + 1000;
    
    // Получаем информацию о маршруте
    const pickupPlace = findPlace(pickup);
    const dropoffPlace = findPlace(dropoff);
    
    // Проверяем, найдены ли места
    if (!pickupPlace || !dropoffPlace) {
        alert('Пожалуйста, выберите место из предложенного списка');
        return;
    }
    
    const distance = calculateDistance(pickupPlace.lat, pickupPlace.lon, dropoffPlace.lat, dropoffPlace.lon);
    const travelTime = calculateTravelTime(distance);
    const price = calculatePrice(distance);
    
    const orderDetails = document.getElementById('orderDetails');
    orderDetails.innerHTML = `
        <strong>📞 Ваш номер:</strong> ${phone}<br>
        <strong>От:</strong> ${pickupPlace.name}<br>
        <strong>До:</strong> ${dropoffPlace.name}<br>
        <strong>Расстояние:</strong> ${distance} км<br>
        <strong>Время в пути:</strong> ${travelTime} минут<br>
        <strong>Стоимость:</strong> ${price} ₽<br>
        <hr style="margin: 15px 0; border: none; border-top: 1px solid #ddd;">
        <h4 style="margin-top: 15px; color: #2A9D8F;">🚗 Ваша машина:</h4>
        <p><strong>Марка и модель:</strong> ${car.brand} ${car.model}</p>
        <p><strong>Цвет:</strong> ${car.color}</p>
        <p><strong>Номер водителя:</strong> ${driverPhone}</p>
    `;
    
    const heading = successMessage.querySelector('h2');
    heading.innerHTML = `✓ Заказ №${orderNumber} принят!`;
    
    // Запускаем анимацию машины по маршруту
    setTimeout(function() {
        animateTaxiMovement();
    }, 500);
    
    // Через 20 секунд показываем уведомление о приезде такси
    setTimeout(function() {
        showArrivalNotification();
    }, 20000);
    
    // Через 40 секунд показываем уведомление о завершении поездки
    setTimeout(function() {
        showCompletionNotification();
    }, 40000);
});

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    console.log('Приложение TaxiBook загружено');
});

// Добавляем слушатели события для обновления цены при изменении полей
pickupInput.addEventListener('input', updatePrice);
dropoffInput.addEventListener('input', updatePrice);
