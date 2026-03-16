import { Navigate, Route, Routes } from 'react-router';
import { GamesRoute } from '@web/routes/GamesRoute';
import { StandingsRoute } from '@web/routes/StandingsRoute';

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/games" replace />} />
      <Route path="/games" element={<GamesRoute />} />
      <Route path="/games/:gameId" element={<GamesRoute />} />
      <Route path="/games/:gameId/:tab" element={<GamesRoute />} />
      <Route path="/standings" element={<StandingsRoute />} />
      <Route path="/standings/:tab" element={<StandingsRoute />} />
      <Route path="/standings/:tab/:scope" element={<StandingsRoute />} />
    </Routes>
  );
}
