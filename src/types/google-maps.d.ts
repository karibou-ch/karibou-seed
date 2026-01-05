/**
 * Type générique pour Google Maps API
 * Évite les erreurs de @googlemaps/js-api-loader
 */

// Déclarer google comme variable globale avec structure minimale
declare var google: {
  maps: {
    CoreLibrary: any;
    MapsLibrary: any;
    Maps3DLibrary: any;
    PlacesLibrary: any;
    GeocodingLibrary: any;
    RoutesLibrary: any;
    MarkerLibrary: any;
    GeometryLibrary: any;
    ElevationLibrary: any;
    StreetViewLibrary: any;
    JourneySharingLibrary: any;
    DrawingLibrary: any;
    VisualizationLibrary: any;
  };
};

declare namespace google.maps {
  interface CoreLibrary {}
  interface MapsLibrary {}
  interface Maps3DLibrary {}
  interface PlacesLibrary {}
  interface GeocodingLibrary {}
  interface RoutesLibrary {}
  interface MarkerLibrary {}
  interface GeometryLibrary {}
  interface ElevationLibrary {}
  interface StreetViewLibrary {}
  interface JourneySharingLibrary {}
  interface DrawingLibrary {}
  interface VisualizationLibrary {}
}
