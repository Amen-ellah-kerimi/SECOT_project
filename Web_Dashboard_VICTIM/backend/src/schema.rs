// @generated automatically by Diesel CLI.

diesel::table! {
    sensor_data (id) {
        id -> Integer,
        sensor_type -> Varchar,
        value -> Double,
        timestamp -> Timestamptz,
    }
}
