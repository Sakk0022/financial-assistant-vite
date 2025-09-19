import React, { useState, useEffect, useMemo } from "react";

const CURRENCY_LIST = [
  { code: "USD", name: "US Dollar", symbol: "$", emoji: "🇺🇸" },
  { code: "EUR", name: "Euro", symbol: "€", emoji: "🇪🇺" },
  { code: "CNY", name: "Chinese Yuan", symbol: "¥", emoji: "🇨🇳" },
  { code: "RUB", name: "Russian Ruble", symbol: "₽", emoji: "🇷🇺" },
  { code: "KZT", name: "Tenge", symbol: "₸", emoji: "🇰🇿" },
];

const find = (code) => CURRENCY_LIST.find((c) => c.code === code) || {};

const KEYWORDS = [
  "статистика",
  "рекомендации",
  "что если",
  "рост курса",
  "задержка платежа",
  "графика закупок",
];

const FinancialAssistantPage = () => {
  const [baseCurrency, setBaseCurrency] = useState("KZT");
  const [apiRates, setApiRates] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState(null);

  useEffect(() => {
    let mounted = true;
    const fetchExchangeRates = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`https://api.exchangerate-api.com/v4/latest/${baseCurrency}`);
        const data = await res.json();
        if (!mounted) return;
        if (data && data.rates) setApiRates(data.rates);
        else setError("No rates in response");
      } catch (err) {
        setError("Не удалось получить курсы валют");
      } finally {
        setLoading(false);
      }
    };

    fetchExchangeRates();
    const interval = setInterval(() => {
      if (autoRefresh) fetchExchangeRates();
    }, 300000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [baseCurrency, autoRefresh]);

  const displayRates = useMemo(() => {
    if (!apiRates) return {};
    const out = {};
    Object.entries(apiRates).forEach(([code, val]) => {
      out[code] = val ? 1 / val : null;
    });
    out[baseCurrency] = 1;
    return out;
  }, [apiRates, baseCurrency]);

  const relativeMax = useMemo(() => {
    if (!displayRates) return 1;
    const arr = Object.keys(displayRates)
      .filter((k) => k !== baseCurrency && displayRates[k])
      .map((k) => displayRates[k]);
    return Math.max(...arr, 1);
  }, [displayRates, baseCurrency]);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (file && file.type === "text/csv") {
      setUploadedFile(file);
      setUploadStatus("Загрузка...");

      const formData = new FormData();
      formData.append("file", file);

      try {
        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (response.ok) {
          setUploadStatus("Файл успешно загружен в базу данных!");
          const reader = new FileReader();
          reader.onload = (e) => {
            console.log("Содержимое CSV:", e.target.result);
          };
          reader.readAsText(file);
        } else {
          setUploadStatus("Ошибка при загрузке файла в базу данных.");
        }
      } catch (err) {
        setUploadStatus("Ошибка при отправке файла: " + err.message);
      }
    } else {
      setUploadedFile(null);
      setUploadStatus("Пожалуйста, загрузите файл в формате .csv");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-blue-50">
      {/* Header */}
      <header className="gradient-bg text-white shadow-xl">
        <div className="max-w-8xl mx-auto px-4 py-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight animate-fade-in mb-4">
            Финансовый AI-Ассистент для Управления Ликвидностью
          </h1>
          <p className="text-lg md:text-xl opacity-90 max-w-2xl mx-auto">
            Инновационные инструменты для оптимизации ваших финансов с реал-тайм анализом и персонализированными советами
          </p>
        </div>
      </header>

      <main className="max-w-8xl mx-auto px-4 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8">
          <aside className="lg:col-span-2 order-2">
            <div className="sidebar">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                  <span className="mr-2">📈</span> Курсы к <span className="ml-2 font-bold">{baseCurrency}</span>
                </h2>
                <div className="flex items-center gap-2">
                  <select
                    value={baseCurrency}
                    onChange={(e) => setBaseCurrency(e.target.value)}
                    className="p-2 rounded-lg border bg-white text-sm"
                  >
                    {CURRENCY_LIST.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.code}
                      </option>
                    ))}
                  </select>
                  <button
                    title="обновить"
                    onClick={() => setApiRates(null)}
                    className="text-sm px-3 py-1 bg-indigo-100 rounded-full"
                  >
                    Обновить
                  </button>
                </div>
              </div>

              {loading ? (
                <div className="flex justify-center items-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
              ) : error ? (
                <p className="text-red-600 text-center text-sm">{error}</p>
              ) : (
                <div>
                  {["USD", "EUR", "CNY", "RUB", "KZT"]
                    .filter((code) => code !== baseCurrency)
                    .map((code) => {
                      const dr = displayRates[code];
                      const info = find(code);
                      return (
                        <div key={code} className="currency-card">
                          <div className="flex items-center">
                            <div className="text-2xl mr-3">{info.emoji}</div>
                            <div>
                              <h3 className="font-medium text-gray-800 text-sm">{info.name}</h3>
                              <p className="text-xs text-gray-500">1 {code} = {dr ? dr.toFixed(4) : "—"} {baseCurrency}</p>
                            </div>
                          </div>
                          <div className="text-right min-w-[96px]">
                            <div className="text-lg font-bold text-indigo-600">{dr ? dr.toFixed(4) : "—"}</div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}

              <div className="mt-4 flex items-center justify-between">
                <label className="text-xs text-gray-500 flex items-center gap-2">
                  <input type="checkbox" checked={autoRefresh} onChange={() => setAutoRefresh(!autoRefresh)} />
                  Авто-обновление
                </label>
                <p className="text-xs text-gray-400">Обновлено: {new Date().toLocaleTimeString("ru-RU")}</p>
              </div>

              {/* --- Загрузка данных --- */}
              <div className="mt-6 pt-4 border-t border-indigo-50">
                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                  <span className="mr-2">📂</span> Загрузи свои данные
                </h3>
                <div className="flex flex-col gap-2">
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    className="p-2 border rounded-lg bg-white text-sm"
                  />
                  {uploadedFile && (
                    <p className="text-sm text-gray-600">Загружен файл: {uploadedFile.name}</p>
                  )}
                  {uploadStatus && (
                    <p className={`text-sm ${uploadStatus.includes("Ошибка") ? "text-red-600" : "text-green-600"}`}>
                      {uploadStatus}
                    </p>
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-2">Загрузите файл .csv для анализа данных.</p>
              </div>

              {/* --- Ключевые Запросы --- */}
              <div className="mt-6 pt-4 border-t border-indigo-50">
                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                  <span className="mr-2">🔑</span> Ключевые Запросы
                </h3>
                <div className="flex flex-col gap-2">
                  {KEYWORDS.map((keyword, index) => (
                    <button
                      key={index}
                      className="keyword-chip w-full text-left"
                      onClick={() => {
                        navigator.clipboard?.writeText(keyword);
                        if (typeof window !== "undefined") {
                          const prev = document.getElementById("kw-toast");
                          if (prev) prev.remove();
                          const t = document.createElement("div");
                          t.id = "kw-toast";
                          t.textContent = `Ключевое слово "${keyword}" скопировано`;
                          t.className = "fixed bottom-6 right-6 bg-black text-white px-4 py-2 rounded-lg shadow-lg";
                          document.body.appendChild(t);
                          setTimeout(() => t.remove(), 1400);
                        }
                      }}
                    >
                      {keyword}
                    </button>
                  ))}
                </div>
                <p className="text-sm text-gray-500 mt-4">Кликните для быстрого ввода в чат. Справа можно описать значение слова.</p>
              </div>
            </div>
          </aside>

          {/* Right: Big Chat */}
          <section className="lg:col-span-3 order-3">
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 animate-fade-in h-full flex flex-col">
              <div className="p-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
                <h2 className="text-xl font-semibold flex items-center justify-between">
                  <span className="flex items-center"><span className="mr-2">🤖</span> Ваш AI-Ассистент</span>
                  <span className="text-sm opacity-80">Чат</span>
                </h2>
              </div>
              <div className="p-3 flex-1">
                <iframe
                  src="https://hackathon.shai.pro/chatbot/XgtqeIIGT8nIz4GX"
                  className="w-full h-full border-0 rounded-lg"
                  allow="microphone"
                  title="AI Assistant Chatbot"
                  sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
                  style={{ minHeight: 640 }}
                />
              </div>
            </div>
          </section>
        </div>
      </main>

      <footer className="text-center text-gray-500 py-6 border-t border-gray-200 mt-12 bg-white/50">
        <p>&copy; 2025 Финансовый AI-Ассистент. Все права защищены.</p>
        <p className="text-sm mt-1">Курсы обновляются автоматически. Для точных данных консультируйтесь с банком.</p>
      </footer>
    </div>
  );
};

export default FinancialAssistantPage;