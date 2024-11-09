import { useState, useEffect } from "react";
import { FlatList, StyleSheet, View } from "react-native";
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
import myColors from "./assets/colors.json";
import myColorsDark from "./assets/colorsDark.json";
import { insertLocation, getAllLocations } from "./db";
import { v4 as uuidv4 } from 'uuid';
import * as Location from 'expo-location';
import 'react-native-get-random-values';


export default function App() {
  const [isSwitchOn, setIsSwitchOn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [locations, setLocations] = useState([]);

  const [theme, setTheme] = useState({
    ...DefaultTheme,
    myOwnProperty: true,
    colors: myColors.colors,
  });

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

  async function onToggleSwitch() {
    try {
      const newSwitchState = !isSwitchOn;
      setIsSwitchOn(newSwitchState);
      await AsyncStorage.setItem("darkMode", JSON.stringify(newSwitchState));
    } catch (error) {
      console.error("Failed to save dark mode", error);
    }
  }

  async function getLocation() {
    setIsLoading(true);
    const { status } = await Location.requestForegroundPermissionsAsync();

    if (status === "granted") {
      const { coords } = await Location.getCurrentPositionAsync({});
      const location = { 
        ...coords,
        id: uuidv4()
      };
      await insertLocation(location);
      console.log(location);
      setLocations(prevLocations => [...prevLocations, location]);
    }
    setIsLoading(false);
  }


  async function loadLocations() {
  }


  useEffect(() => {
    loadDarkMode();
    loadLocations();
  }, []);

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
          onPress={() => getLocation()}
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
