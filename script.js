const apiKey = "8ae780d44433664862da06b218c9e998";
const apiUrl = "https://api.openweathermap.org/data/2.5/weather";
const forecastApiUrl = "https://api.openweathermap.org/data/2.5/forecast";
const airPollutionUrl = "https://api.openweathermap.org/data/2.5/air_pollution";
const geocodeApiUrl = "http://api.openweathermap.org/geo/1.0/direct";

let unit = "metric";

const locations = [
    "Hà Nội", "Quận Ba Đình", "Quận Hoàn Kiếm", "Quận Đống Đa", "Quận Hai Bà Trưng",
    "TP Hồ Chí Minh", "Quận 1", "Quận 3", "Quận 7", "Quận Bình Thạnh",
    "Đà Nẵng", "Quận Hải Châu", "Quận Thanh Khê", "Quận Sơn Trà"
];

function getWeather() {
    const city = document.getElementById("city-input").value;
    if (!city) {
        alert("Vui lòng nhập tên khu vực!");
        return;
    }
    fetchWeather(city);
    fetchForecast(city);
    fetchAirPollution(city);
    document.getElementById("suggestions").style.display = "none";
}

function getCurrentLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            position => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                fetchWeatherByCoords(lat, lon);
                fetchForecastByCoords(lat, lon);
                fetchAirPollutionByCoords(lat, lon);
            },
            error => {
                if (error.code === error.PERMISSION_DENIED) {
                    alert("Bạn đã từ chối cấp quyền vị trí. Vui lòng cho phép trong cài đặt trình duyệt!");
                } else {
                    alert("Không thể lấy vị trí: " + error.message);
                }
            }
        );
    } else {
        alert("Trình duyệt của bạn không hỗ trợ định vị!");
    }
}

function suggestLocations() {
    const input = document.getElementById("city-input").value.toLowerCase();
    const suggestions = document.getElementById("suggestions");
    suggestions.innerHTML = "";
    
    if (input.length < 2) {
        suggestions.style.display = "none";
        return;
    }

    const matches = locations.filter(loc => loc.toLowerCase().includes(input));
    if (matches.length > 0) {
        matches.forEach(loc => {
            const div = document.createElement("div");
            div.textContent = loc;
            div.onclick = () => {
                document.getElementById("city-input").value = loc;
                suggestions.style.display = "none";
                getWeather();
            };
            suggestions.appendChild(div);
        });
        suggestions.style.display = "block";
    } else {
        suggestions.style.display = "none";
    }

    fetch(`${geocodeApiUrl}?q=${input}&limit=5&appid=${apiKey}`)
        .then(response => response.json())
        .then(data => {
            data.forEach(loc => {
                const name = `${loc.name}${loc.state ? ", " + loc.state : ""}, ${loc.country}`;
                if (!matches.includes(name)) {
                    const div = document.createElement("div");
                    div.textContent = name;
                    div.onclick = () => {
                        document.getElementById("city-input").value = name;
                        suggestions.style.display = "none";
                        getWeather();
                    };
                    suggestions.appendChild(div);
                }
            });
            if (data.length > 0 || matches.length > 0) {
                suggestions.style.display = "block";
            }
        });
}

function toggleUnit() {
    unit = unit === "metric" ? "imperial" : "metric";
    document.getElementById("unit-toggle").textContent = unit === "metric" ? "°C/°F" : "°F/°C";
    const city = document.getElementById("city-input").value;
    if (city) getWeather();
}

function toggleTheme() {
    document.body.classList.toggle("dark");
    document.getElementById("theme-toggle").textContent = document.body.classList.contains("dark") ? "Chế độ sáng" : "Chế độ tối";
}

function fetchWeather(city) {
    const url = `${apiUrl}?q=${city}&appid=${apiKey}&units=${unit}&lang=vi`;
    fetch(url)
        .then(response => {
            if (!response.ok) throw new Error("Không tìm thấy khu vực!");
            return response.json();
        })
        .then(data => displayWeather(data))
        .catch(error => alert(error.message));
}

function fetchWeatherByCoords(lat, lon) {
    const url = `${apiUrl}?lat=${lat}&lon=${lon}&appid=${apiKey}&units=${unit}&lang=vi`;
    fetch(url)
        .then(response => {
            if (!response.ok) throw new Error("Không thể lấy dữ liệu thời tiết!");
            return response.json();
        })
        .then(data => displayWeather(data))
        .catch(error => alert(error.message));
}

function fetchForecast(city) {
    const url = `${forecastApiUrl}?q=${city}&appid=${apiKey}&units=${unit}&lang=vi`;
    fetch(url)
        .then(response => {
            if (!response.ok) throw new Error("Không thể lấy dữ liệu dự báo!");
            return response.json();
        })
        .then(data => {
            displayHourlyForecast(data);
            displayDailyForecast(data);
        })
        .catch(error => alert(error.message));
}

function fetchForecastByCoords(lat, lon) {
    const url = `${forecastApiUrl}?lat=${lat}&lon=${lon}&appid=${apiKey}&units=${unit}&lang=vi`;
    fetch(url)
        .then(response => {
            if (!response.ok) throw new Error("Không thể lấy dữ liệu dự báo!");
            return response.json();
        })
        .then(data => {
            displayHourlyForecast(data);
            displayDailyForecast(data);
        })
        .catch(error => alert(error.message));
}

function fetchAirPollution(city) {
    fetch(`${geocodeApiUrl}?q=${city}&limit=1&appid=${apiKey}`)
        .then(response => response.json())
        .then(data => {
            const lat = data[0].lat;
            const lon = data[0].lon;
            fetch(`${airPollutionUrl}?lat=${lat}&lon=${lon}&appid=${apiKey}`)
                .then(response => response.json())
                .then(data => displayAQI(data));
        })
        .catch(error => console.log("Không thể lấy AQI: " + error.message));
}

function fetchAirPollutionByCoords(lat, lon) {
    fetch(`${airPollutionUrl}?lat=${lat}&lon=${lon}&appid=${apiKey}`)
        .then(response => response.json())
        .then(data => displayAQI(data))
        .catch(error => console.log("Không thể lấy AQI: " + error.message));
}

function displayWeather(data) {
    const weatherInfo = document.getElementById("weather-info");
    const cityName = document.getElementById("city-name");
    const temperature = document.getElementById("temperature");
    const description = document.getElementById("description");
    const humidity = document.getElementById("humidity");
    const wind = document.getElementById("wind");
    const rain = document.getElementById("rain");
    const pressure = document.getElementById("pressure");
    const visibility = document.getElementById("visibility");
    const weatherIcon = document.getElementById("weather-icon");

    cityName.textContent = `${data.name}, ${data.sys.country}`;
    temperature.textContent = `Nhiệt độ: ${data.main.temp}${unit === "metric" ? "°C" : "°F"}`;
    description.textContent = `Thời tiết: ${data.weather[0].description}`;
    humidity.textContent = `Độ ẩm: ${data.main.humidity}%`;
    wind.textContent = `Tốc độ gió: ${data.wind.speed} ${unit === "metric" ? "m/s" : "mph"}`;
    rain.textContent = `Độ mưa: ${data.rain ? (data.rain["1h"] || 0) : 0} mm`;
    pressure.textContent = `Áp suất: ${data.main.pressure} hPa`;
    visibility.textContent = `Tầm nhìn: ${data.visibility / 1000} km`;
    weatherIcon.innerHTML = `<img src="http://openweathermap.org/img/wn/${data.weather[0].icon}.png" alt="Weather Icon">`;

    // Hiệu ứng nền động (chỉ thêm class, không đổi background)
    document.body.classList.remove("rain", "clear", "clouds");
    if (data.weather[0].main === "Rain") document.body.classList.add("rain");
    else if (data.weather[0].main === "Clear") document.body.classList.add("clear");
    else if (data.weather[0].main === "Clouds") document.body.classList.add("clouds");

    weatherInfo.classList.add("show");
}

function displayAQI(data) {
    const aqi = data.list[0].main.aqi;
    const aqiInfo = document.getElementById("aqi-info");
    aqiInfo.textContent = `Chỉ số AQI: ${aqi} (${getAQILevel(aqi)})`;
}

function getAQILevel(aqi) {
    if (aqi === 1) return "Tốt";
    if (aqi === 2) return "Trung bình";
    if (aqi === 3) return "Không lành mạnh cho nhóm nhạy cảm";
    if (aqi === 4) return "Không lành mạnh";
    return "Nguy hiểm";
}

function displayHourlyForecast(data) {
    const hourlyList = document.getElementById("hourly-list");
    const hourlySection = document.getElementById("hourly-forecast");
    hourlyList.innerHTML = "";

    const hourlyData = data.list.slice(0, 8);
    hourlyData.forEach(item => {
        const time = new Date(item.dt * 1000).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
        const temp = item.main.temp;
        const desc = item.weather[0].description;
        const icon = item.weather[0].icon;

        const div = document.createElement("div");
        div.classList.add("forecast-item");
        div.innerHTML = `
            <p>${time}</p>
            <img src="http://openweathermap.org/img/wn/${icon}.png" alt="Weather Icon">
            <p>${temp}${unit === "metric" ? "°C" : "°F"}</p>
            <p>${desc}</p>
        `;
        hourlyList.appendChild(div);
    });

    hourlySection.classList.add("show");
}

function displayDailyForecast(data) {
    const dailyList = document.getElementById("daily-list");
    const dailySection = document.getElementById("daily-forecast");
    dailyList.innerHTML = "";

    const dailyData = [];
    const dates = new Set();
    data.list.forEach(item => {
        const date = new Date(item.dt * 1000).toLocaleDateString("vi-VN");
        if (!dates.has(date) && dates.size < 5) {
            dates.add(date);
            dailyData.push(item);
        }
    });

    dailyData.forEach(item => {
        const date = new Date(item.dt * 1000).toLocaleDateString("vi-VN");
        const temp = item.main.temp;
        const desc = item.weather[0].description;
        const icon = item.weather[0].icon;

        const div = document.createElement("div");
        div.classList.add("forecast-item");
        div.innerHTML = `
            <p>${date}</p>
            <img src="http://openweathermap.org/img/wn/${icon}.png" alt="Weather Icon">
            <p>${temp}${unit === "metric" ? "°C" : "°F"}</p>
            <p>${desc}</p>
        `;
        dailyList.appendChild(div);
    });

    dailySection.classList.add("show");
}

// Widget thời gian thực
setInterval(() => {
    const city = document.getElementById("city-input").value;
    if (city) getWeather();
}, 15 * 60 * 1000); // Cập nhật mỗi 15 phút

// Gán sự kiện
document.getElementById("theme-toggle").addEventListener("click", toggleTheme);
document.getElementById("unit-toggle").addEventListener("click", toggleUnit);