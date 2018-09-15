<template>
  <v-app>
    <v-toolbar
      color="blue darken-3"
      dark
      app
      :clipped-left="$vuetify.breakpoint.mdAndUp"
      fixed>
      <v-toolbar-title style="width: 125px" class="ml-0 pl-3">
        <span class="hidden-sm-and-down">Advertiser</span>
      </v-toolbar-title>
      <v-autocomplete
        v-model="searchValue"
        :items="items"
        :loading="isLoading"
        :search-input.sync="search"
        color="white"
        hide-no-data
        hide-selected
        clearable
        clear-icon="clear"
        item-text="advertiserName"
        item-value="advertiserName"
        placeholder="Enter brand name"
        prepend-inner-icon="search"
        return-object
        style="width:0px;margin-top:6px;">
      </v-autocomplete>
      <!-- <v-spacer></v-spacer> -->
      <v-toolbar-title style="width: 125px" class="ml-0 pl-3">
        <span class="hidden-sm-and-down">Timeline</span>
      </v-toolbar-title>
      <v-select
        v-if="!modal"
        v-model="timelineSelected"
        style="width: 0px;margin-top:6px;"
        :items = "timelineList">
      </v-select>
      <v-dialog
        ref="dialog"
        v-model="modal"
        :return-value.sync="picker"
        persistent
        lazy
        full-width
        width="290px"
        v-if="timelineSelected === 'Custom Date'">
        <v-text-field
          slot="activator"
          v-model="picker"
          label="Select Date"
          prepend-icon="event"
          style="margin-top:6px;"
          readonly>
        </v-text-field>
        <v-date-picker v-model="picker" scrollable>
          <v-spacer></v-spacer>
          <v-btn flat color="primary" @click="modal = false">Cancel</v-btn>
          <v-btn flat color="primary" @click="$refs.dialog.save(picker)">OK</v-btn>
        </v-date-picker>
      </v-dialog>
    </v-toolbar>
    <v-content>
      <v-container fluid fill-height>
        <v-layout justify-center align-center>
          <v-card>
          <v-subheader v-if="searchValue" class="left-message">Hello {{searchValue.advertiserName}}</v-subheader>
          <v-subheader v-if="searchValue && timelineSelected!=='Custom Date'" class="right-message">Showing {{timelineSelected}} data</v-subheader>
          <v-subheader v-if="searchValue && timelineSelected==='Custom Date'" class="right-message">Showing {{showDate}} data</v-subheader>
          <v-data-table
            :headers="headers"
            :items="tableData"
            hide-actions
            class="elevation-1">
            <template slot="items" slot-scope="props">
              <td>{{ props.item.name }}</td>
              <td>{{ props.item.campaign }}</td>
              <td>{{ props.item.campaignCount }}</td>
            </template>
          </v-data-table>
          </v-card>
        </v-layout>
      </v-container>
    </v-content>
  </v-app>
</template>

<script>
import axios from 'axios'
export default {
  name: 'Adverstise',
  data: () => ({
    descriptionLimit: 60,
    entries: [],
    isLoading: false,
    searchValue: null,
    search: null,
    timelineSelected: '',
    timelineDescription: '',
    advertiserDetails: [],
    picker: null,
    landscape: false,
    reactive: true,
    pickedDate: true,
    modal: false,
    timelineList: [
      'Today',
      'Last 7 days',
      'Last Month',
      'Last Quarter',
      'Last Year',
      'Custom Date'
    ],
    timeDateRange: null,
    showDate: '',
    headers: [
      {
        text: 'Brand Name',
        value: 'name'
      },
      {
        text: 'First Campaign Name',
        value: 'campaign'
      },
      {
        text: 'Count of Campaigns inside brand',
        value: 'campaignCount'
      }
    ]
  }),
  computed: {
    fields () {
      if (!this.searchValue) return []
      return Object.keys(this.searchValue).map(key => {
        return {
          key: key,
          value: this.searchValue[key] || 'n/a'
        }
      })
    },
    items () {
      return this.entries
    },
    tableData () {
      return this.advertiserDetails || []
    }
  },

  watch: {
    search (val) {
      // Items have already been loaded
      if (this.items.length > 0) return
      this.isLoading = true
      // Lazily load input items
      axios.get('https://cors-anywhere.herokuapp.com/https://s3-ap-southeast-1.amazonaws.com/he-public-data/data%20(1)4614ba8.json')
        .then(res => {
          const jsonData = res.data
          this.entries = jsonData
        })
        .catch(err => {
          console.log(err)
        })
        .finally(() => (this.isLoading = false))
    },
    timelineSelected () {
      let finalDate = new Date()
      if (this.timelineSelected === 'Last 7 days') {
        finalDate.setDate(finalDate.getDate() - 7)
      }
      if (this.timelineSelected === 'Last Month') {
        finalDate.setMonth(finalDate.getMonth() - 1)
      }
      if (this.timelineSelected === 'Last Quarter') {
        finalDate.setMonth(new Date().getMonth() - 3)
      }
      if (this.timelineSelected === 'Last Year') {
        finalDate.setFullYear(finalDate.getFullYear() - 1)
      }
      if (this.timelineSelected !== 'Custom Date') {
        this.timeDateRange = new Date(finalDate)
        this.tableDetails()
      } else {
        this.picker = null
        this.pickedDate = false
      }
    },
    searchValue () {
      this.tableDetails()
    },
    picker () {
      if (this.timelineSelected === 'Custom Date' && this.picker) {
        this.timeDateRange = new Date(this.picker)
        this.showDate = this.timeDateRange.toDateString()
        this.pickedDate = true
        this.tableDetails()
      }
    },
    advertiserDetails () {
    },
    deep: true
  },
  methods: {
    tableDetails () {
      if (this.entries.length > 0) {
        this.advertiserDetails = []
        if (this.searchValue) {
          this.entries.map((entry) => {
            if (entry.advertiserName === this.searchValue.advertiserName) {
              let campaignDetails = []
              entry.campaigns.map((campaign) => {
                let dateParts = campaign.start_date.split('-')
                let dateObject = new Date(dateParts[2], dateParts[1] - 1, dateParts[0])
                if (this.timelineSelected !== 'Custom Date' || this.timelineSelected !== 'Today') {
                  if (dateObject >= this.timeDateRange && dateObject < new Date()) {
                    campaignDetails.push(campaign)
                  }
                } else {
                  if (dateObject.toDateString() === this.timeDateRange.toDateString()) {
                    campaignDetails.push(campaign)
                  }
                }
              })
              campaignDetails.sort((a, b) => {
                if (a.start_date > b.start_date) return 1
                if (a.start_date < b.start_date) return -1
              })
              if (campaignDetails.length > 0) {
                this.advertiserDetails.push({name: entry.name, campaignCount: campaignDetails.length, campaign: campaignDetails[0].name, budget: entry.budget})
              } else {
                this.advertiserDetails = []
              }
            }
          })
        }
        if (this.advertiserDetails.length > 0) {
          this.advertiserDetails.sort((a, b) => {
            if (a.budget >= b.budget) return 1
            if (a.budget < b.budget) return -1
          })
        }
        if (this.advertiserDetails.length > 5) {
          this.advertiserDetails = this.advertiserDetails.slice(0, 5)
        }
      }
    }
  },
  created () {
    this.timelineSelected = this.timelineList[0]
  }
}
</script>
<!-- Add "scoped" attribute to limit CSS to this component only -->
<style>
.v-menu {
  left: -700px;
}
.left-message {
  position: fixed;
  top: 150px;
  left:350px;
  font-size: large;
}
.right-message {
  position: fixed;
  top: 150px;
  left:800px;
  font-size: large;
}
</style>
