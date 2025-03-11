const apiKey = "8ae780d44433664862da06b218c9e998";
const apiUrl = "https://api.openweathermap.org/data/2.5/weather";
const forecastApiUrl = "https://api.openweathermap.org/data/2.5/forecast";
const airPollutionUrl = "https://api.openweathermap.org/data/2.5/air_pollution";
const geocodeApiUrl = "http://api.openweathermap.org/geo/1.0/direct";

let unit = "metric";
let hourlyChart, dailyChart; // Biến lưu trữ biểu đồ

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

function refreshWeather() {
    const city = document.getElementById("city-input").value;
    if (!city) {
        alert("Vui lòng nhập tên khu vực trước khi làm mới!");
        return;
    }
    getWeather();
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
    updateChartColors(); // Cập nhật màu biểu đồ khi đổi theme
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
    const datetime = document.getElementById("datetime");
    const temperature = document.getElementById("temperature");
    const description = document.getElementById("description");
    const humidity = document.getElementById("humidity");
    const wind = document.getElementById("wind");
    const rain = document.getElementById("rain");
    const pressure = document.getElementById("pressure");
    const visibility = document.getElementById("visibility");
    const weatherIcon = document.getElementById("weather-icon");
    const alert = document.getElementById("weather-alert");

    cityName.textContent = `${data.name}, ${data.sys.country}`;
    updateTime(datetime); // Cập nhật thời gian thực
    temperature.textContent = `Nhiệt độ: ${data.main.temp}${unit === "metric" ? "°C" : "°F"}`;
    description.textContent = `Thời tiết: ${data.weather[0].description}`;
    humidity.textContent = `Độ ẩm: ${data.main.humidity}%`;
    wind.textContent = `Tốc độ gió: ${data.wind.speed} ${unit === "metric" ? "m/s" : "mph"}`;
    rain.textContent = `Độ mưa: ${data.rain ? (data.rain["1h"] || 0) : 0} mm`;
    pressure.textContent = `Áp suất: ${data.main.pressure} hPa`;
    visibility.textContent = `Tầm nhìn: ${data.visibility / 1000} km`;
    weatherIcon.innerHTML = `<img src="http://openweathermap.org/img/wn/${data.weather[0].icon}.png" alt="Weather Icon">`;
    
    // Thông báo thời tiết
    alert.classList.remove("show");
    if (data.rain && data.rain["1h"] > 3) {
        alert.textContent = `Cảnh báo: Mưa lớn (${data.rain["1h"]} mm) trong 1 giờ tới!`;
        alert.classList.add("show");
    } else if (data.main.temp > 35 && unit === "metric") {
        alert.textContent = "Cảnh báo: Nhiệt độ cao vượt 35°C!";
        alert.classList.add("show");
    } else if (data.wind.speed > 15 && unit === "metric") {
        alert.textContent = "Cảnh báo: Gió mạnh (tốc độ > 15 m/s)!";
        alert.classList.add("show");
    }

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
    const labels = [];
    const temps = [];

    hourlyData.forEach((item, index) => {
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
        div.addEventListener("click", () => showHourlyDetails(item));
        hourlyList.appendChild(div);

        // Thu thập dữ liệu cho biểu đồ
        labels.push(time);
        temps.push(temp);
    });

    // Vẽ biểu đồ nhiệt độ theo giờ
    if (hourlyChart) hourlyChart.destroy(); // Hủy biểu đồ cũ nếu có
    const ctx = document.getElementById("hourly-chart").getContext("2d");
    hourlyChart = new Chart(ctx, {
        type: "line",
        data: {
            labels: labels,
            datasets: [{
                label: `Nhiệt độ (${unit === "metric" ? "°C" : "°F"})`,
                data: temps,
                borderColor: document.body.classList.contains("dark") ? "#93c5fd" : "#1e40af",
                backgroundColor: "rgba(59, 130, 246, 0.2)",
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            scales: {
                y: { beginAtZero: false }
            },
            plugins: {
                legend: { display: false }
            }
        }
    });

    hourlySection.classList.add("show");
}

function displayDailyForecast(data) {
    const dailyList = document.getElementById("daily-list");
    const dailySection = document.getElementById("daily-forecast");
    dailyList.innerHTML = "";

    const dailyData = [];
    const dates = new Set();
    const labels = [];
    const temps = [];

    data.list.forEach(item => {
        const date = new Date(item.dt * 1000).toLocaleDateString("vi-VN");
        if (!dates.has(date) && dates.size < 5) {
            dates.add(date);
            dailyData.push(item);

            // Thu thập dữ liệu cho biểu đồ
            labels.push(date);
            temps.push(item.main.temp);
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

    // Vẽ biểu đồ nhiệt độ theo ngày
    if (dailyChart) dailyChart.destroy(); // Hủy biểu đồ cũ nếu có
    const ctx = document.getElementById("daily-chart").getContext("2d");
    dailyChart = new Chart(ctx, {
        type: "line",
        data: {
            labels: labels,
            datasets: [{
                label: `Nhiệt độ (${unit === "metric" ? "°C" : "°F"})`,
                data: temps,
                borderColor: document.body.classList.contains("dark") ? "#93c5fd" : "#1e40af",
                backgroundColor: "rgba(59, 130, 246, 0.2)",
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            scales: {
                y: { beginAtZero: false }
            },
            plugins: {
                legend: { display: false }
            }
        }
    });

    dailySection.classList.add("show");
}

function showHourlyDetails(item) {
    const modal = document.getElementById("weather-modal");
    document.getElementById("modal-time").textContent = new Date(item.dt * 1000).toLocaleString("vi-VN");
    document.getElementById("modal-icon").innerHTML = `<img src="http://openweathermap.org/img/wn/${item.weather[0].icon}.png" alt="Weather Icon">`;
    document.getElementById("modal-temp").textContent = `Nhiệt độ: ${item.main.temp}${unit === "metric" ? "°C" : "°F"}`;
    document.getElementById("modal-desc").textContent = `Thời tiết: ${item.weather[0].description}`;
    document.getElementById("modal-humidity").textContent = `Độ ẩm: ${item.main.humidity}%`;
    document.getElementById("modal-wind").textContent = `Tốc độ gió: ${item.wind.speed} ${unit === "metric" ? "m/s" : "mph"}`;
    document.getElementById("modal-rain").textContent = `Độ mưa: ${item.rain ? (item.rain["1h"] || 0) : 0} mm`;
    document.getElementById("modal-pressure").textContent = `Áp suất: ${item.main.pressure} hPa`;

    modal.classList.add("show");
}

function closeModal() {
    const modal = document.getElementById("weather-modal");
    modal.classList.remove("show");
}

// Widget thời gian thực
function updateTime(datetimeElement) {
    const update = () => {
        const now = new Date();
        datetimeElement.textContent = `Cập nhật: ${now.toLocaleDateString("vi-VN")} ${now.toLocaleTimeString("vi-VN")}`;
    };
    update();
    setInterval(update, 1000); // Cập nhật mỗi giây
}

// Cập nhật màu biểu đồ khi đổi theme
function updateChartColors() {
    if (hourlyChart) {
        hourlyChart.data.datasets[0].borderColor = document.body.classList.contains("dark") ? "#93c5fd" : "#1e40af";
        hourlyChart.data.datasets[0].backgroundColor = "rgba(59, 130, 246, 0.2)";
        hourlyChart.update();
    }
    if (dailyChart) {
        dailyChart.data.datasets[0].borderColor = document.body.classList.contains("dark") ? "#93c5fd" : "#1e40af";
        dailyChart.data.datasets[0].backgroundColor = "rgba(59, 130, 246, 0.2)";
        dailyChart.update();
    }
}

// Gán sự kiện
document.getElementById("theme-toggle").addEventListener("click", toggleTheme);
document.getElementById("unit-toggle").addEventListener("click", toggleUnit);

// Cập nhật tự động mỗi 15 phút
setInterval(() => {
    const city = document.getElementById("city-input").value;
    if (city) getWeather();
}, 15 * 60 * 1000);