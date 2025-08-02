import React, { useState, useRef } from "react";

export default function App() {
  const [form, setForm] = useState({
    deviceImei: ""
  });
  const [response, setResponse] = useState(null);
  const [deviceList, setDeviceList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const messageCounter = useRef(1);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      await fetch("/ygvcs/service/web/device/setKeyboardLock", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "lang": "en_US"
        },
        body: JSON.stringify({
          deviceImei: form.deviceImei,
          state: "1"
        })
      });

      const deviceInfoRes = await fetch(
        "/ygvcs/service/web/device/getDeviceInfo",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "lang": "en_US"
          },
          body: JSON.stringify({
            deviceImei: form.deviceImei
          })
        }
      );
      const deviceInfoData = await deviceInfoRes.json();
      const startSiteCode = deviceInfoData?.data?.startSiteCode;
      const endSiteCode = deviceInfoData?.data?.endSiteCode;

      const sendTaskRes = await fetch(
        "/ygvcs/service/web/userTask/sendTask",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "lang": "en_US"
          },
          body: JSON.stringify({
            messageId: messageCounter.current,
            startSiteCode: String(startSiteCode || endSiteCode || "0"),
            deviceImei: form.deviceImei
          })
        }
      );

      const taskData = await sendTaskRes.json();
      setResponse(taskData);
      messageCounter.current += 1;
    } catch (err) {
      setError(err.message || "Błąd połączenia z API");
    }

    setLoading(false);
  };

  const handleFetchDevices = async () => {
    setLoading(true);
    setError(null);
    setDeviceList([]);

    try {
      const res = await fetch(
        "/ygvcs/service/web/device/getDeviceList",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "lang": "en_US"
          },
          body: JSON.stringify({})
        }
      );
      const data = await res.json();
      if (data?.success && Array.isArray(data.data)) {
        const filteredDevices = data.data.filter(
          (device) => device.flag === "83"
        );
        setDeviceList(filteredDevices);
        if (filteredDevices.length > 0) {
          setForm((prev) => ({ ...prev, deviceImei: filteredDevices[0].deviceImei }));
        }
      }
    } catch (err) {
      setError("Błąd pobierania listy urządzeń");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 flex flex-col items-center">
      <h1 className="text-2xl font-bold mb-4">Wysyłanie zadania do wózka</h1>

      <div className="grid gap-4 w-full max-w-md">
        <select
          className="border p-2 rounded"
          name="deviceImei"
          value={form.deviceImei}
          onChange={handleChange}
        >
          {deviceList.map((device) => (
            <option key={device.deviceImei} value={device.deviceImei}>
              {device.deviceName} ({device.deviceImei})
            </option>
          ))}
        </select>

        <button
          onClick={handleSubmit}
          className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
          disabled={loading || !form.deviceImei}
        >
          {loading ? "Czekaj..." : "Wyślij zadanie"}
        </button>

        <button
          onClick={handleFetchDevices}
          className="bg-green-600 text-white p-2 rounded hover:bg-green-700"
          disabled={loading}
        >
          {loading ? "Czekaj..." : "Pobierz listę urządzeń"}
        </button>
      </div>

      {response && (
        <div className="mt-6 bg-white shadow-md p-4 rounded w-full max-w-md">
          <h2 className="text-lg font-semibold mb-2">Odpowiedź serwera:</h2>
          <p className="mb-2 text-sm text-gray-700">{response.resultMsg}</p>
          <pre className="text-sm bg-gray-100 p-2 rounded overflow-auto">
            {JSON.stringify(response, null, 2)}
          </pre>
        </div>
      )}

      {error && (
        <div className="mt-4 text-red-600 font-semibold">{error}</div>
      )}
    </div>
  );
}
