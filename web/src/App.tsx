import { Navigate, Route, Routes } from 'react-router';
import { GamesRoute } from '@web/routes/GamesRoute';

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/games" replace />} />
      <Route path="/games" element={<GamesRoute />} />
      <Route path="/games/:gameId" element={<GamesRoute />} />
      <Route path="/games/:gameId/:tab" element={<GamesRoute />} />
    </Routes>
  );
}
