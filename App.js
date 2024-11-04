import { useState, useEffect } from "react";
import { FlatList, StyleSheet, View, Alert } from "react-native";
import {
  Appbar,
  Button,
  List,
  PaperProvider,
  Switch,
  Text,
  MD3LightTheme as DefaultTheme,
} from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Geolocation from "@react-native-community/geolocation";
import SQLite from "react-native-sqlite-storage";
import myColors from "./assets/colors.json";r
import myColorsDark from "./assets/colorsDark.json";

// Configurações do banco de dados
const db = SQLite.openDatabase(
  {
    name: "LocationsDB",
    location: "default",
  },
  () => {},
  error => {
    console.log("Error opening database", error);
  }
);

export default function App() {
  const [isSwitchOn, setIsSwitchOn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [locations, setLocations] = useState([]);

  const [theme, setTheme] = useState({
    ...DefaultTheme,
    myOwnProperty: true,
    colors: myColors.colors,
  });

  // Carrega o estado do darkMode do AsyncStorage
  async function loadDarkMode() {
    try {
      const darkModeValue = await AsyncStorage.getItem("darkMode");
      if (darkModeValue !== null) {
        setIsSwitchOn(JSON.parse(darkModeValue));
      }
    } catch (error) {
      console.error("Failed to load dark mode", error);
    }
  }

  // Evento do switch de darkMode
  async function onToggleSwitch() {
    try {
      const newSwitchState = !isSwitchOn;
      setIsSwitchOn(newSwitchState);
      await AsyncStorage.setItem("darkMode", JSON.stringify(newSwitchState));
    } catch (error) {
      console.error("Failed to save dark mode", error);
    }
  }

  // Configuração inicial do banco de dados
  function initializeDatabase() {
    db.transaction(tx => {
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS locations (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          latitude REAL,
          longitude REAL
        );`
      );
    });
  }

  // Captura e salva a localização do dispositivo
  async function getLocation() {
    setIsLoading(true);
    Geolocation.getCurrentPosition(
      position => {
        const { latitude, longitude } = position.coords;
        saveLocation(latitude, longitude);
        setIsLoading(false);
      },
      error => {
        console.error("Failed to get location", error);
        setIsLoading(false);
        Alert.alert("Erro", "Não foi possível obter a localização.");
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 1000 }
    );
  }

  // Salva a localização no banco de dados SQLite
  function saveLocation(latitude, longitude) {
    db.transaction(tx => {
      tx.executeSql(
        "INSERT INTO locations (latitude, longitude) VALUES (?, ?);",
        [latitude, longitude],
        (_, result) => {
          console.log("Location saved with id:", result.insertId);
          loadLocations(); // Atualiza a lista de localizações após salvar
        },
        error => {
          console.error("Failed to save location", error);
        }
      );
    });
  }

  // Carrega as localizações do banco de dados SQLite
  function loadLocations() {
    setIsLoading(true);
    db.transaction(tx => {
      tx.executeSql("SELECT * FROM locations;", [], (_, { rows }) => {
        let locationsList = [];
        for (let i = 0; i < rows.length; i++) {
          locationsList.push(rows.item(i));
        }
        setLocations(locationsList);
        setIsLoading(false);
      });
    });
  }

  // UseEffect para configurar o banco de dados e carregar o darkMode e localizações salvas
  useEffect(() => {
    initializeDatabase();
    loadDarkMode();
    loadLocations();
  }, []);

  // Atualiza o tema quando o isSwitchOn é alterado
  useEffect(() => {
    setTheme({ ...theme, colors: isSwitchOn ? myColorsDark.colors : myColors.colors });
  }, [isSwitchOn]);

  return (
    <PaperProvider theme={theme}>
      <Appbar.Header>
        <Appbar.Content title="My Location BASE" />
      </Appbar.Header>
      <View style={{ backgroundColor: theme.colors.background }}>
        <View style={styles.containerDarkMode}>
          <Text>Dark Mode</Text>
          <Switch value={isSwitchOn} onValueChange={onToggleSwitch} />
        </View>
        <Button
          style={styles.containerButton}
          icon="map"
          mode="contained"
          loading={isLoading}
          onPress={getLocation}
        >
          Capturar localização
        </Button>

        <FlatList
          style={styles.containerList}
          data={locations}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <List.Item
              title={`Localização ${item.id}`}
              description={`Latitude: ${item.latitude} | Longitude: ${item.longitude}`}
            />
          )}
        />
      </View>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  containerDarkMode: {
    margin: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  containerButton: {
    margin: 10,
  },
  containerList: {
    margin: 10,
    height: "100%",
  },
});
