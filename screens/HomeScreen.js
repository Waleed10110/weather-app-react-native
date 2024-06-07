import { StatusBar } from "expo-status-bar";
import React, { useCallback, useEffect, useState } from "react";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ScrollView,
  KeyboardAvoidingView,
} from "react-native";
import { Image } from "react-native";
import { theme } from "../theme";
import { MagnifyingGlassIcon, MapIcon } from "react-native-heroicons/outline";
import { CalendarDaysIcon, MapPinIcon } from "react-native-heroicons/solid";
import { debounce } from "lodash";
import {fetchLocations, fetchWeatherForecast} from '../api/weather'
import { weatherImages } from "../constants";
import * as Progress from 'react-native-progress'
import { storeData,getData } from "../Utils/asyncStorage";


const HomeScreen = () => {
  const [showSearch, toggleSearch] = useState(false);
  const [locations, setlocations] = useState([]);
  const [weather,setWeather] = useState({});
  const [loading,setLoading] = useState(true);

  const handlelocations = (loc) => {
    console.log("location", loc);
     setlocations([]);
     setLoading(true);
     toggleSearch(false);
     fetchWeatherForecast({cityName:loc?.name,days:'7'
     }).then(data=>{
      setWeather(data);
      setLoading(false);
      storeData('city',loc?.name)
     })
  };

  useEffect(()=>{
    fetchMyWeatherData();
  },[]);

  const fetchMyWeatherData = async ()=>{
    let myCity = await getData('city');
    let cityName = 'Islamabad';
    if(myCity) cityName=myCity;

    fetchWeatherForecast({
      cityName,
      days:'7'
    }).then(
      data=>{
        setLoading(false);
        setWeather(data);
      }
    )
  }

  const handleSearch = (value) => {
    //fetch locations
    if(value.length>2){
      fetchLocations({cityName:value}).then(data=>{
        setlocations(data)
      })
    }
  };

  const handleTextDebounce = useCallback(debounce(handleSearch, 1200), []);
  const {current,location,forecast}=weather;

  const otherContent = current?[
    { content: `${current?.wind_kph}km`, img: require("../assets/icons/wind.png") },
    { content: `${current?.humidity}%`, img: require("../assets/icons/drop.png") },
    { content: `${weather?.forecast?.forecastday[0]?.astro?.sunrise}`, img: require("../assets/icons/sun.png") },
  ]:[];
  

  return (
    <KeyboardAvoidingView className="flex-1 relative bg-gray-950">
      <StatusBar style="light" />
      <Image
        blurRadius={75}
        source={require("../assets/images/bg.png")}
        className="absolute h-full w-full"
      />{
        loading?(
          <View className="flex-1 justify-center items-center">
            <Progress.CircleSnail thickness={10} size={140} color='#0bb3b2'/>
          </View>
        ):(<SafeAreaView className="flex flex-1">
          {/* Search Bar */}
          <View style={{ height: "7%" }} className="mx-4 z-50 relative mt-12 ">
            <View
              className="flex-row justify-end items-center rounded-full"
              style={{ backgroundColor: showSearch ? theme.bgWhite(0.2) : null }}
            >
              {showSearch ? (
                <TextInput
                  onChangeText={handleTextDebounce}
                  placeholder="Search City ............."
                  className="pl-7 h-10 text-base flex-1 text-white"
                />
              ) : null}
              <TouchableOpacity
                onPress={() => toggleSearch(!showSearch)}
                className="rounded-full m-1 p-3  "
                style={{ backgroundColor: theme.bgWhite(0.3) }}
              >
                <MagnifyingGlassIcon size="25" color="white" />
              </TouchableOpacity>
            </View>
            {locations.length > 0 && showSearch ? (
              <View className="absolute w-full bg-gray-300 top-16 rounded-3xl">
                {locations.map((loc, index) => {
                  let showBorder = index + 1 != locations.length;
                  let borderClass = showBorder
                    ? "border-b-2 border-b-gray-400"
                    : "";
                  return (
                    <TouchableOpacity
                      onPress={() => handlelocations(loc)}
                      key={index}
                      className={
                        "flex-row items-center border-0 p-3 px-4 mb-1 " +
                        borderClass
                      }
                    >
                      <MapPinIcon size="20" color="gray" />
                      <Text className="text-black text-lg ml-2">
                        {loc?.name},{loc?.country}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : null}
          </View>
          {/* foreacaste section */}
          <View className="mx-4 flex flex-1 justify-around mb-2">
            {/* location */}
            <Text className="text-white font-bold text-2xl  text-center">
              {location?.name},
              <Text className="text-gray-300 font-semibold text-lg   ">
              {""+location?.country}
              </Text>
            </Text>
            {/* weather Image */}
            <View className="flex-row justify-center ">
              <Image
                source={weatherImages[current?.condition?.text]}
                className="w-52 h-52"
              />
            </View>
            {/* degree celcius */}
            <View className="space-y-2">
              <Text className="text-white text-center ml-5 font-bold text-6xl ">
              {current?.temp_c}&#176;
              </Text>
              <Text className="text-white text-center  tracking-widest text-xl ">
                {current?.condition?.text}
              </Text>
            </View>
            {/* Other Stats */}
            <View className="flex-row justify-between mx-4">
              {otherContent.map((item, index) => {
                return (
                  <View key={index} className="flex-row space-x-2 items-center">
                    <Image source={item.img} className="w-7 h-7" />
                    <Text className="text-white text-base text-semibold">
                      {item.content}
                    </Text>
                  </View>
                );
              })}
            </View>
            {/* Other days forecaste */}
            <View className="mb-4 space-y-2">
              <View className="flex-row items-center mx-5 space-x-2">
                <CalendarDaysIcon size="22" color="white" />
                <Text className="text-white text-base">Daily foreacaste</Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {weather?.forecast?.forecastday?.map((items, index) => {
                  let date = new Date(items.date);
                  let options = {weekday:'long'};
                  let dayName = date.toLocaleDateString('en-US',options);
                  dayName = dayName.split('.')[0];
                  return (
                    <View
                      key={index}
                      className="flex justify-center items-center w-24 rounded-3xl py-3 space-y-1 mr-2"
                      style={{ backgroundColor: theme.bgWhite(0.15) }}
                      >
                      <Image
                        source={weatherImages[items?.day?.condition?.text]}
                        className="w-11 h-11"
                      />
                      <Text className="text-white ">
                        {dayName}
                      </Text>
                      <Text className="text-white text-xl text-semibold">
                        {items?.day.avgtemp_c}&#176;
                      </Text>
                    </View>
                  );
                })}
              </ScrollView>
            </View>
          </View>
        </SafeAreaView>)
      }
      
    </KeyboardAvoidingView>
    
  );
};

export default HomeScreen;
