# Cozy Cafe Compass

Build "BrewNear" — a beautiful, offline-capable cafe finder web app

Create a modern PWA using React + TypeScript + Tailwind + shadcn/ui that helps users discover nearby cafes.

Core Features:

Interactive map (Leaflet/Mapbox) centered on user's geolocation, showing cafes as pins

Radius filter: toggle between 100m, 200m, 500m, 1km — dynamically update visible cafes and draw a radius circle on the map

Distance mode toggle: "By Road" (driving) vs "Walking" — show route line + ETA + distance for each, using OpenRouteService or OSRM API

Cafe list/grid view synced with map (click pin ↔ highlight card)

Filter & group by: Rating, Price range ($/$$/$$$), Ambience/Scenario (cozy, work-friendly, outdoor seating, romantic), Culture/Cuisine type, and Reviews

Cafe detail panel: name, photos, address, phone, email, opening hours, rating, price, reviews, "Get Directions" button

Offline support: Service Worker + IndexedDB/localStorage caching so previously loaded cafes, map tiles, and routes work without internet

Search bar with autocomplete + current location button

Design:

Warm, cafe-inspired theme (cream, espresso brown, terracotta accents)

Clean card-based UI, smooth animations/transitions, mobile-first responsive design

Bottom sheet map+list layout on mobile, split view on desktop

Custom minimalist logo: a coffee cup merged with a location pin icon, in the brand colors

Data: Use mock/sample cafe data (JSON) with lat/lng, ratings, price, hours, contact info, and photos for demo purposes, structured so it can later connect to Google Places/Foursquare API.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://brewfinder-app.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/c0bd41c1-665a-4bac-a7c9-962da87b4904).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
