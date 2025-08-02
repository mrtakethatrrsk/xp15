import React, { useState } from "react";

export default function App() {
  const [form, setForm] = useState({
    messageId: "",
    deviceImei: "12345678"
  });
  const [response, setResponse] = useState(null);
  const [deviceList, setDeviceList] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      // Step 1: Get device info to extract startSiteCode
      const deviceInfoRes = await fetch(
        "/ygvcs/service/web/device/getDeviceInfo",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            deviceImei: form.deviceImei
          })
        }
      );
      const deviceInfoData = await deviceInfoRes.json();

      const startSiteCode = deviceInfoData?.data?.startSiteCode;

      // Step 2: Send task using obtained startSiteCode
      const sendTaskRes = await fetch(
        "/ygvcs/service/web/userTask/sendTask",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            messageId: form.messageId,
            startSiteCode: String(startSiteCode || "0"),
            deviceImei: form.deviceImei,
            customerId: "1023",
            startHandel: "1",
            endHandel: "2",
            startStorageHeight: "0",
            endStorageHeight: "0",
            upDownHeight: "100"
          })
        }
      );

      const taskData = await sendTaskRes.json();
      setResponse(taskData);
    } catch (err) {
      setError(err.message || "Błąd połączenia z API");
    }

    setLoading(false);
  };

  const handleFetchDevices = async () => {
    setLoading(true);
    setError(null);
    setDeviceList(null);

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
      setDeviceList(data);
    } catch (err) {
      setError("Błąd pobierania listy urządzeń");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 flex flex-col items-center">
      <h1 className="text-2xl font-bold mb-4">Wysyłanie zadania do wózka</h1>

      <div className="grid gap-4 w-full max-w-md">
        <input
          className="border p-2 rounded"
          placeholder="messageId"
          name="messageId"
          value={form.messageId}
          onChange={handleChange}
        />
        <input
          className="border p-2 rounded"
          placeholder="deviceImei"
          name="deviceImei"
          value={form.deviceImei}
          onChange={handleChange}
        />
        <button
          onClick={handleSubmit}
          className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
          disabled={loading}
        >
          {loading ? "Wysyłanie..." : "Wyślij zadanie"}
        </button>

        <button
          onClick={handleFetchDevices}
          className="bg-green-600 text-white p-2 rounded hover:bg-green-700"
          disabled={loading}
        >
          {loading ? "Ładowanie..." : "Pokaż listę urządzeń"}
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

      {deviceList && (
        <div className="mt-6 bg-white shadow-md p-4 rounded w-full max-w-md">
          <h2 className="text-lg font-semibold mb-2">Lista urządzeń:</h2>
          <pre className="text-sm bg-gray-100 p-2 rounded overflow-auto">
            {JSON.stringify(deviceList, null, 2)}
          </pre>
        </div>
      )}

      {error && (
        <div className="mt-4 text-red-600 font-semibold">{error}</div>
      )}
    </div>
  );
}