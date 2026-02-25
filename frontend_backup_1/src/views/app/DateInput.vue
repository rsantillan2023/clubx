<template>
  <!--COMPONENTIZANDO INPUTS DE FECHA: Se recibe la fecha a setear por la prop 'fecha' en formato 'YYYY-MM-DD', se emite el evento 'changeDate' cada que la fecha es cambiada en este componente, si el campo es requerido se debe enviar la prop 'required' como true, si se quiere validar la edad se debe recibir la prop validationAge como true-->
  <v-menu
    v-model="menu"
    :close-on-content-click="false"
    transition="scale-transition"
    offset-y
    max-width="290px"
    min-width="auto"
    :nudge-top="25"
  >
    <template v-slot:activator="{ on, attrs }">
      <v-text-field
        v-model="dateFormatted"
        persistent-hint
        :label="label"
        outlined
        clearable
        placeholder="DD/MM/AAAA"
        @click:prepend-inner="menu = !menu"
        @click:clear="date = ''"
        dense
        :disabled="disabled"
        @keyup="setDate"
        :rules="rules"
        maxlength="10"
      >
        <template v-slot:prepend-inner>
          <v-icon v-bind="attrs" v-on="on">mdi-calendar</v-icon>
        </template>
      </v-text-field>
    </template>
    <v-date-picker
      locale="es-ES"
      v-model="dateOfMenu"
      @input="menu = false"
    ></v-date-picker>
  </v-menu>
</template>

<script>
export default {
  data: vm => ({
    dateOfMenu: '',
    date: null,
    dateFormatted: null,
    menu: false,
    aa: vm
  }),
  computed: {
    rules(){
      let formatDate = (v) => this.formatCorrect(v) || 'El formato fecha debe ser DD/MM/AAAA';
      let oldAge = (v) => (v == null || this.calculateAge(v) < 120) || 'Fecha Invalida';
      let rules = [formatDate, oldAge]
      if(this.required) rules.push((v) => !!v || 'La fecha es requerida')
      if(this.validationAge) rules.push((v) => this.calculateAge(v) > 17 || 'La persona debe ser mayor de 18 años')
      return rules
    }
  },
  watch: {
    date () {
      this.dateFormatted = this.formatDate(this.date)
      if(this.date != 'Invalid date'){
        this.dateOfMenu == this.date
        this.$emit('changeDate', this.date);
      }else this.dateOfMenu == ''
        
      
    },
    dateOfMenu(val){
      this.date = val
    },
    fecha(){
      this.set()
    }
  },
  methods: {
    formatCorrect(date){
      if(date == null) return true
      if(date.length != 10) return false
      else{
        let validDate = this.$moment(date, 'DD/MM/YYYY')
        let [day, month, year] = date.split("/")
        if(validDate._isValid && day.length == 2 && month.length == 2 && year.length == 4) return true
      }
    },
    setDate(){
      if(this.dateFormatted == null || this.dateFormatted == '') this.date = null

      this.dateFormatted.replace(/(-*)/, '/')
      if(this.dateFormatted.length == 10){
        this.date = this.parseDate(this.dateFormatted)
      }
    },
    set(){
      if(this.fecha != null && this.fecha != undefined && this.fecha != ''){
        let fecha = this.fecha;
        //cambio de separador
        let separator = "-";
        if(this.fecha.includes("/")) separator = "/";
        let arr = this.fecha.split(separator);
        if(arr[0].length == 2) fecha = arr[2]+"-"+arr[1]+"-"+arr[0];
        
        this.date = fecha;
      }else{
        this.date = ''
      }
    },
    formatDate (date) {
      return (date && date.length==10) ? this.$moment(date, 'YYYY-MM-DD').format('DD/MM/YYYY') : null
    },
    parseDate (date) {
      return (date) ? this.$moment(date, 'DD/MM/YYYY').format('YYYY-MM-DD') : null
    },
    calculateAge(fecha){
      fecha = this.$moment(fecha, 'DD/MM/YYYY').format('YYYY-MM-DD')
      var hoy = new Date();
      var cumpleanos = new Date(fecha);
      var edad = hoy.getFullYear() - cumpleanos.getFullYear();
      var m = hoy.getMonth() - cumpleanos.getMonth();
      if (m < 0 || (m === 0 && hoy.getDate() < cumpleanos.getDate())) {
          edad--;
      }
      return edad;
    }
  },
  beforeMount(){
    this.set()
  },
  props:['fecha', 'required', 'validationAge', 'disabled', 'label']
}
</script>